import React, { useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";

interface FluidWindMapProps {
  aqi: number | null;
  windSpeed: number; // in km/h
  windDirection: number; // in degrees (0 = from North, 90 = from East, etc.)
}

export function FluidWindMap({ aqi = 35, windSpeed = 8, windDirection = 90 }: FluidWindMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use WebGL context (fallback to webgl2 if supported, standard webgl is highly compatible)
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") as WebGLRenderingContext | null;
    if (!gl) {
      console.warn("WebGL not supported, fluid wind visualization disabled.");
      return;
    }

    // --- Shaders Source ---
    const vsSource = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      varying vec4 v_color;
      uniform vec2 u_resolution;
      attribute float a_size;
      void main() {
        // Convert screen coordinates to WebGL clipspace (-1.0 to 1.0)
        vec2 zeroToOne = a_position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
        gl_PointSize = a_size;
        v_color = a_color;
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec4 v_color;
      void main() {
        // Render soft circles instead of square points
        float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
        if (dist > 0.5) discard;
        // Anti-aliased glow edge
        float alpha = smoothstep(0.5, 0.15, dist) * v_color.a;
        gl_FragColor = vec4(v_color.rgb, alpha);
      }
    `;

    // --- Helper: compile shader ---
    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    // --- Program ---
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    // --- Get attribute/uniform locations ---
    const positionLoc = gl.getAttribLocation(program, "a_position");
    const colorLoc = gl.getAttribLocation(program, "a_color");
    const sizeLoc = gl.getAttribLocation(program, "a_size");
    const resolutionLoc = gl.getUniformLocation(program, "u_resolution");

    // --- Particle Setup ---
    // Classify counts and colors based on AQI
    const isMobile = window.innerWidth < 768;
    let maxParticles = isMobile ? 150 : 800;
    let particleColor = { r: 59 / 255, g: 130 / 255, b: 246 / 255, a: 0.25 }; // Sky blue for good

    const currentAqi = aqi ?? 30;
    if (currentAqi <= 50) {
      maxParticles = isMobile ? 150 : 800;
      // Good: Soft emerald
      particleColor = isDark 
        ? { r: 52 / 255, g: 211 / 255, b: 153 / 255, a: 0.35 }
        : { r: 5 / 255, g: 150 / 255, b: 105 / 255, a: 0.26 }; // Richer emerald, visible on light background
    } else if (currentAqi <= 100) {
      maxParticles = isMobile ? 250 : 1400;
      // Moderate: Soft amber
      particleColor = isDark
        ? { r: 251 / 255, g: 191 / 255, b: 36 / 255, a: 0.38 }
        : { r: 217 / 255, g: 119 / 255, b: 6 / 255, a: 0.28 }; // Richer amber
    } else {
      maxParticles = isMobile ? 350 : 2600;
      // Unhealthy: Warm red/grey dust haze
      particleColor = isDark
        ? { r: 248 / 255, g: 113 / 255, b: 113 / 255, a: 0.45 }
        : { r: 220 / 255, g: 38 / 255, b: 38 / 255, a: 0.34 }; // Richer crimson red
    }

    const particles: { x: number; y: number; size: number; alpha: number; speedOffset: number }[] = [];
    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;

    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 4.0 + Math.random() * 8.0, // size 4px to 12px for better visual appeal
        alpha: (0.4 + Math.random() * 0.6) * particleColor.a,
        speedOffset: 0.8 + Math.random() * 0.7 // speed variation
      });
    }

    // Typed arrays for GPU upload
    // We send: X, Y (position), R, G, B, A (color), Size (size) -> 7 floats per particle
    const stride = 7;
    const dataArray = new Float32Array(maxParticles * stride);

    // Create GL buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, dataArray, gl.DYNAMIC_DRAW);

    // Setup viewport
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    };
    window.addEventListener("resize", handleResize);

    // Animation variables
    let animationId: number;
    let time = 0;

    // Direction mapping (degrees -> radians). Wind direction is direction *from*.
    // Velocity is opposite: direction + 180 degrees.
    const angleRad = (windDirection + 180) * (Math.PI / 180);
    // scale wind speed to screen velocity. 10km/h wind ~ 0.5px/frame
    const baseSpeed = Math.max(0.2, (windSpeed || 5) * 0.08);
    const vx = Math.cos(angleRad) * baseSpeed;
    const vy = Math.sin(angleRad) * baseSpeed;

    const render = () => {
      time += 0.008;

      gl.clearColor(0, 0, 0, 0); // Transparent canvas background
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      // Set resolution uniform
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      // Update particle positions on CPU and fill typed array
      for (let i = 0; i < maxParticles; i++) {
        const p = particles[i];

        // ── Curl flow / organic turbulence field ──
        // Combining low-frequency sine/cosine waves to create fluid eddies
        const curlX = Math.sin(p.y * 0.003 + time) * 0.4;
        const curlY = Math.cos(p.x * 0.003 + time) * 0.4;

        // Apply wind velocity + curl noise + speed offset
        p.x += (vx + curlX) * p.speedOffset;
        p.y += (vy + curlY) * p.speedOffset;

        // Wrap around boundaries
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Write to array buffer
        const idx = i * stride;
        dataArray[idx] = p.x;
        dataArray[idx + 1] = p.y;
        
        // Dynamic color shading based on breathing / time cycle
        const pulse = Math.sin(time + p.x * 0.01) * 0.15 + 0.85;
        dataArray[idx + 2] = particleColor.r;
        dataArray[idx + 3] = particleColor.g;
        dataArray[idx + 4] = particleColor.b;
        dataArray[idx + 5] = p.alpha * pulse;
        
        dataArray[idx + 6] = p.size;
      }

      // Upload buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, dataArray);

      // Enable attributes
      const bytesPerFloat = Float32Array.BYTES_PER_ELEMENT;
      
      // a_position: 2 floats, offset 0
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, stride * bytesPerFloat, 0);

      // a_color: 4 floats, offset 2 * bytesPerFloat
      gl.enableVertexAttribArray(colorLoc);
      gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, stride * bytesPerFloat, 2 * bytesPerFloat);

      // a_size: 1 float, offset 6 * bytesPerFloat
      gl.enableVertexAttribArray(sizeLoc);
      gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, stride * bytesPerFloat, 6 * bytesPerFloat);

      // Enable alpha blending for soft dots
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // Draw particles
      gl.drawArrays(gl.POINTS, 0, maxParticles);

      animationId = requestAnimationFrame(render);
    };

    // Start loop
    render();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [aqi, windSpeed, windDirection, isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen pointer-events-none opacity-80 transition-opacity duration-1000"
      style={{ zIndex: 0 }}
    />
  );
}
