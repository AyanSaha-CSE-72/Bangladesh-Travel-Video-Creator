import React from 'react';
import { VehicleType } from '../types/route';

/**
 * High-fidelity vehicle renderers for both interactive React Map & Canvas Video Export.
 */

// Draw vehicle directly on HTML5 2D Canvas with realistic details, shadows, and headlight glow
export function drawVehicleOnCanvas(
  ctx: CanvasRenderingContext2D,
  type: VehicleType,
  x: number,
  y: number,
  headingDeg: number,
  scale: number = 1
) {
  ctx.save();
  ctx.translate(x, y);
  // Heading in degrees: 0 is North (up). On canvas, 0 rad is East (right).
  // Therefore, rotation = (headingDeg - 90) * Math.PI / 180
  const rotRad = ((headingDeg - 90) * Math.PI) / 180;
  ctx.rotate(rotRad);
  ctx.scale(scale, scale);

  // Soft drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 12 * scale;
  ctx.shadowOffsetX = 2 * scale;
  ctx.shadowOffsetY = 4 * scale;

  if (type === 'car') {
    // 1. Headlight beam effect
    const beamGrad = ctx.createLinearGradient(16, 0, 52, 0);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(16, -7);
    ctx.lineTo(50, -18);
    ctx.lineTo(50, 18);
    ctx.lineTo(16, 7);
    ctx.closePath();
    ctx.fill();

    // 2. Car Chassis Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(-22, -13, 44, 26, 8);
    ctx.fill();

    // 3. Wheels / Tires (Top-down angled perspective)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-16, -14, 9, 4, 2);
    ctx.roundRect(8, -14, 9, 4, 2);
    ctx.roundRect(-16, 10, 9, 4, 2);
    ctx.roundRect(8, 10, 9, 4, 2);
    ctx.fill();

    // 4. Car Body (Classic Retro Red Travel Car)
    ctx.fillStyle = '#dc2626'; // Red body
    ctx.beginPath();
    ctx.roundRect(-21, -12, 42, 24, 6);
    ctx.fill();

    // Chrome Bumper (Front)
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(19, -10, 3, 20);

    // Chrome Bumper (Rear)
    ctx.fillRect(-22, -10, 2, 20);

    // Front Windshield
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(4, -9, 9, 18, 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(6, -7, 4, 14);

    // Rear Windshield
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-15, -8, 6, 16, 2);
    ctx.fill();

    // 5. Roof Rack (Black bars)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-10, -9, 18, 18);

    // 6. TravelBoast Roof Luggage (Purple / Magenta Suitcase with straps!)
    ctx.fillStyle = '#9333ea'; // Vibrant Purple Suitcase
    ctx.beginPath();
    ctx.roundRect(-8, -7, 14, 14, 3);
    ctx.fill();

    // Luggage yellow/white straps
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-4, -7, 1.5, 14);
    ctx.fillRect(0, -7, 1.5, 14);

    // Suitcase handle
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(4, -2, 2, 4);

    // Headlights (Warm glow)
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(20, -7, 2.5, 0, Math.PI * 2);
    ctx.arc(20, 7, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Taillights
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.arc(-20, -8, 2, 0, Math.PI * 2);
    ctx.arc(-20, 8, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'bus') {
    // 1. Bus Headlight beam
    const beamGrad = ctx.createLinearGradient(24, 0, 60, 0);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(24, -8);
    ctx.lineTo(58, -20);
    ctx.lineTo(58, 20);
    ctx.lineTo(24, 8);
    ctx.closePath();
    ctx.fill();

    // Bus Body (Iconic travel coach, vibrant turquoise/emerald or royal indigo)
    ctx.fillStyle = '#0284c7'; // Travel coach blue
    ctx.beginPath();
    ctx.roundRect(-26, -12, 52, 24, 5);
    ctx.fill();

    // White Roof stripe
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-22, -9, 44, 18, 3);
    ctx.fill();

    // Windows rows
    ctx.fillStyle = '#0f172a';
    for (let i = -16; i <= 14; i += 7) {
      ctx.fillRect(i, -8, 5, 4);
      ctx.fillRect(i, 4, 5, 4);
    }
    // Front windshield
    ctx.fillRect(18, -7, 5, 14);

    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(25, -9, 2.5, 0, Math.PI * 2);
    ctx.arc(25, 9, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Taillights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-26, -10, 2, 4);
    ctx.fillRect(-26, 6, 2, 4);
  } else if (type === 'train') {
    // Bangladesh Railway Express Train with Locomotive + 3 Passenger Bogies (Coaches)
    // 1. Headlight beam forward from front locomotive nose
    const beamGrad = ctx.createLinearGradient(48, 0, 95, 0);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(48, -5);
    ctx.lineTo(92, -18);
    ctx.lineTo(92, 18);
    ctx.lineTo(48, 5);
    ctx.closePath();
    ctx.fill();

    // 2. Locomotive Engine (Front cab at x = 22 to 50)
    ctx.fillStyle = '#065f46'; // Forest green locomotive
    ctx.beginPath();
    ctx.roundRect(22, -9, 28, 18, 4);
    ctx.fill();

    // Aerodynamic front nose
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.arc(46, 0, 7, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    // Gold/Yellow locomotive livery stripe
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(22, -1.5, 27, 3);

    // Cab windshield & side windows
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(40, -6, 5, 12);
    ctx.fillRect(26, -7, 6, 4);
    ctx.fillRect(26, 3, 6, 4);

    // Front headlight
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(49, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Coupler 1 (Engine to Coach 1)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(17, -2.5, 6, 5);

    // 3. Bogie / Coach 1 (x = -8 to 18)
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.roundRect(-8, -8, 26, 16, 2.5);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-8, -1.2, 26, 2.4);
    // Coach 1 windows
    ctx.fillStyle = '#0f172a';
    for (let wx = -5; wx <= 13; wx += 6) {
      ctx.fillRect(wx, -6.5, 4, 3);
      ctx.fillRect(wx, 3.5, 4, 3);
    }
    // Roof vent
    ctx.fillStyle = '#047857';
    ctx.fillRect(-4, -2, 18, 4);

    // Coupler 2 (Coach 1 to Coach 2)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-13, -2.5, 6, 5);

    // 4. Bogie / Coach 2 (x = -38 to -12)
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.roundRect(-38, -8, 26, 16, 2.5);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-38, -1.2, 26, 2.4);
    // Coach 2 windows
    ctx.fillStyle = '#0f172a';
    for (let wx = -35; wx <= -17; wx += 6) {
      ctx.fillRect(wx, -6.5, 4, 3);
      ctx.fillRect(wx, 3.5, 4, 3);
    }
    // Roof vent
    ctx.fillStyle = '#047857';
    ctx.fillRect(-34, -2, 18, 4);

    // Coupler 3 (Coach 2 to Coach 3)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-43, -2.5, 6, 5);

    // 5. Bogie / Coach 3 - Rear Guard / Passenger Van (x = -68 to -42)
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.roundRect(-68, -8, 26, 16, 2.5);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-68, -1.2, 26, 2.4);
    // Coach 3 windows
    ctx.fillStyle = '#0f172a';
    for (let wx = -65; wx <= -47; wx += 6) {
      ctx.fillRect(wx, -6.5, 4, 3);
      ctx.fillRect(wx, 3.5, 4, 3);
    }
    // Rear red marker lights
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-67, -4.5, 2, 0, Math.PI * 2);
    ctx.arc(-67, 4.5, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'motorcycle') {
    // Motorcycle Headlight beam
    const beamGrad = ctx.createLinearGradient(12, 0, 42, 0);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(12, -3);
    ctx.lineTo(40, -12);
    ctx.lineTo(40, 12);
    ctx.lineTo(12, 3);
    ctx.closePath();
    ctx.fill();

    // Bike Frame & Wheels (top-down view)
    // Front wheel
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(10, -3, 8, 6, 2);
    ctx.fill();

    // Rear wheel
    ctx.beginPath();
    ctx.roundRect(-16, -3, 8, 6, 2);
    ctx.fill();

    // Body chassis (Orange adventure tourer)
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.roundRect(-8, -4, 16, 8, 3);
    ctx.fill();

    // Handlebars
    ctx.fillStyle = '#334155';
    ctx.fillRect(6, -9, 3, 18);

    // Rider with helmet
    ctx.fillStyle = '#0284c7'; // Rider jacket
    ctx.beginPath();
    ctx.arc(-2, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // Helmet
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Visor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(2, -2.5, 2, 5);

    // Headlight
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(17, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'airplane') {
    // 1. High-altitude drop shadow (offset further to simulate 30,000 ft cruising altitude)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(14, 16, 26, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Twin Jet Contrails / Vapor Trails behind jet engines
    const contrailGrad = ctx.createLinearGradient(-12, 0, -65, 0);
    contrailGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
    contrailGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
    contrailGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.strokeStyle = contrailGrad;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    // Left engine contrail
    ctx.beginPath();
    ctx.moveTo(-10, -11);
    ctx.lineTo(-65, -13);
    ctx.stroke();
    // Right engine contrail
    ctx.beginPath();
    ctx.moveTo(-10, 11);
    ctx.lineTo(-65, 13);
    ctx.stroke();

    // 3. Swept Delta Wings (Aircraft main wings)
    ctx.fillStyle = '#e2e8f0'; // Airplane light silver/white wings
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-12, -30);
    ctx.lineTo(-18, -30);
    ctx.lineTo(-8, -4);
    ctx.lineTo(-8, 4);
    ctx.lineTo(-18, 30);
    ctx.lineTo(-12, 30);
    ctx.closePath();
    ctx.fill();

    // Wing edge trim
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Jet Turbofan Engines (Under wings)
    ctx.fillStyle = '#334155';
    // Left engine
    ctx.beginPath();
    ctx.roundRect(-8, -13, 14, 5, 2.5);
    ctx.fill();
    // Right engine
    ctx.beginPath();
    ctx.roundRect(-8, 8, 14, 5, 2.5);
    ctx.fill();

    // Engine intake cones (Front of turbines)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(6, -10.5, 2.2, 0, Math.PI * 2);
    ctx.arc(6, 10.5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // 4. Horizontal Stabilizers (Tail wings)
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(-32, -13);
    ctx.lineTo(-35, -13);
    ctx.lineTo(-29, 0);
    ctx.lineTo(-35, 13);
    ctx.lineTo(-32, 13);
    ctx.closePath();
    ctx.fill();

    // 5. Airplane Fuselage (Aerodynamic sleek body, facing East / +x)
    const fuselageGrad = ctx.createLinearGradient(0, -6, 0, 6);
    fuselageGrad.addColorStop(0, '#ffffff');
    fuselageGrad.addColorStop(0.5, '#f8fafc');
    fuselageGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = fuselageGrad;

    ctx.beginPath();
    // Nose cone at x = 32
    ctx.moveTo(32, 0);
    ctx.bezierCurveTo(28, -6, 18, -6.5, 0, -6.5);
    ctx.lineTo(-24, -4.5);
    ctx.lineTo(-34, 0); // Tail cone
    ctx.lineTo(-24, 4.5);
    ctx.lineTo(0, 6.5);
    ctx.bezierCurveTo(18, 6.5, 28, 6, 32, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Cockpit Visor (Dark tinted cockpit glass)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(25, -3.5);
    ctx.bezierCurveTo(27, -2.5, 27, 2.5, 25, 3.5);
    ctx.lineTo(21, 2.5);
    ctx.lineTo(21, -2.5);
    ctx.closePath();
    ctx.fill();

    // Passenger cabin windows row
    ctx.fillStyle = '#38bdf8';
    for (let wx = -18; wx <= 14; wx += 4) {
      ctx.fillRect(wx, -4.5, 2, 1.2);
      ctx.fillRect(wx, 3.3, 2, 1.2);
    }

    // Vertical Stabilizer / Rudder Fin (Vertical tail)
    ctx.fillStyle = '#dc2626'; // Vibrant travel red fin
    ctx.beginPath();
    ctx.moveTo(-20, -1);
    ctx.lineTo(-33, -1);
    ctx.lineTo(-34, 1);
    ctx.lineTo(-20, 1);
    ctx.closePath();
    ctx.fill();

    // Wingtip Navigation Strobes (Port Red, Starboard Green)
    // Left wingtip = Port = Red
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-14, -30, 2, 0, Math.PI * 2);
    ctx.fill();
    // Right wingtip = Starboard = Green
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(-14, 30, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  ctx.restore();
}

/**
 * Draw an articulated train on canvas with locomotive and multiple connected coaches,
 * each placed at its own pixel coordinates and rotated according to its own local tangent angle.
 */
export function drawArticulatedTrainOnCanvas(
  ctx: CanvasRenderingContext2D,
  bogiePix: { x: number; y: number; headingDeg: number; isLocomotive: boolean; index: number }[],
  scale: number = 1.1
) {
  if (bogiePix.length === 0) return;

  // 1. Draw Coupler connections between adjacent bogies
  ctx.save();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4 * scale;
  ctx.lineCap = 'round';
  for (let i = 0; i < bogiePix.length - 1; i++) {
    const b1 = bogiePix[i];
    const b2 = bogiePix[i + 1];
    ctx.beginPath();
    ctx.moveTo(b1.x, b1.y);
    ctx.lineTo(b2.x, b2.y);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Draw each coach from tail (Coach 3) to front (Locomotive) so front sits on top
  for (let i = bogiePix.length - 1; i >= 0; i--) {
    const b = bogiePix[i];
    ctx.save();
    ctx.translate(b.x, b.y);
    const rotRad = ((b.headingDeg - 90) * Math.PI) / 180;
    ctx.rotate(rotRad);
    ctx.scale(scale, scale);

    // Soft carriage drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8 * scale;
    ctx.shadowOffsetX = 2 * scale;
    ctx.shadowOffsetY = 3 * scale;

    if (b.isLocomotive) {
      // LOCOMOTIVE ENGINE
      // Headlight glow beam
      const beamGrad = ctx.createLinearGradient(16, 0, 56, 0);
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
      beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(16, -5);
      ctx.lineTo(54, -18);
      ctx.lineTo(54, 18);
      ctx.lineTo(16, 5);
      ctx.closePath();
      ctx.fill();

      // Main Cab Body
      ctx.fillStyle = '#065f46'; // Forest green
      ctx.beginPath();
      ctx.roundRect(-14, -9, 28, 18, 4);
      ctx.fill();

      // Aerodynamic curved nose
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.arc(12, 0, 7.5, -Math.PI / 2, Math.PI / 2);
      ctx.fill();

      // Gold Bangladesh Railway Livery Stripe
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-14, -1.5, 27, 3);

      // Cab Windshield & Windows
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(8, -6, 5, 12);
      ctx.fillRect(-6, -7, 6, 4);
      ctx.fillRect(-6, 3, 6, 4);

      // Headlight lamp
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(18, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // PASSENGER COACH / BOGIE
      ctx.fillStyle = '#065f46'; // Green body
      ctx.beginPath();
      ctx.roundRect(-14, -8, 28, 16, 3);
      ctx.fill();

      // Gold Livery Stripe
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-14, -1.2, 28, 2.4);

      // Passenger Windows
      ctx.fillStyle = '#0f172a';
      for (let wx = -10; wx <= 8; wx += 6) {
        ctx.fillRect(wx, -6.5, 4, 3);
        ctx.fillRect(wx, 3.5, 4, 3);
      }

      // Roof Ventilators / Air Conditioning unit
      ctx.fillStyle = '#047857';
      ctx.fillRect(-10, -2.5, 20, 5);

      // If last coach (guard van), add rear red marker lights
      if (b.index === bogiePix.length - 1) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(-14, -4.5, 2, 0, Math.PI * 2);
        ctx.arc(-14, 4.5, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
    ctx.restore();
  }
}

// React SVG Icon components for UI selection & badges
export const CarIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 44 26" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Wheels */}
    <rect x="6" y="2" width="8" height="3" rx="1.5" fill="#0F172A" />
    <rect x="28" y="2" width="8" height="3" rx="1.5" fill="#0F172A" />
    <rect x="6" y="21" width="8" height="3" rx="1.5" fill="#0F172A" />
    <rect x="28" y="21" width="8" height="3" rx="1.5" fill="#0F172A" />
    {/* Car Body */}
    <rect x="2" y="4" width="38" height="18" rx="4" fill="#DC2626" />
    {/* Chrome Bumpers */}
    <rect x="38" y="6" width="2.5" height="14" rx="1" fill="#E2E8F0" />
    <rect x="1.5" y="6" width="2" height="14" rx="1" fill="#E2E8F0" />
    {/* Windshield */}
    <rect x="24" y="6" width="9" height="14" rx="2" fill="#0F172A" />
    <rect x="6" y="7" width="5" height="12" rx="1" fill="#0F172A" />
    {/* Roof Rack */}
    <rect x="11" y="5" width="13" height="16" rx="1" stroke="#1E293B" strokeWidth="1.2" fill="none" />
    {/* Purple Travel Suitcase / Luggage */}
    <rect x="12" y="6" width="11" height="14" rx="2.5" fill="#9333EA" />
    <rect x="15" y="6" width="1.5" height="14" fill="#FBBF24" />
    <rect x="19" y="6" width="1.5" height="14" fill="#FBBF24" />
    {/* Headlights */}
    <circle cx="38" cy="7" r="1.8" fill="#FEF08A" />
    <circle cx="38" cy="19" r="1.8" fill="#FEF08A" />
  </svg>
);

export const BusIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 52 26" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="2" y="3" width="48" height="20" rx="4" fill="#0284C7" />
    <rect x="5" y="5" width="42" height="16" rx="2" fill="#F8FAFC" />
    <rect x="38" y="7" width="7" height="12" rx="1" fill="#0F172A" />
    <rect x="29" y="6" width="5" height="4" rx="1" fill="#0F172A" />
    <rect x="21" y="6" width="5" height="4" rx="1" fill="#0F172A" />
    <rect x="13" y="6" width="5" height="4" rx="1" fill="#0F172A" />
    <rect x="29" y="16" width="5" height="4" rx="1" fill="#0F172A" />
    <rect x="21" y="16" width="5" height="4" rx="1" fill="#0F172A" />
    <rect x="13" y="16" width="5" height="4" rx="1" fill="#0F172A" />
    <circle cx="48" cy="6" r="2" fill="#FEF08A" />
    <circle cx="48" cy="20" r="2" fill="#FEF08A" />
    <rect x="2" y="6" width="2" height="3" fill="#EF4444" />
    <rect x="2" y="17" width="2" height="3" fill="#EF4444" />
  </svg>
);

export const TrainIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 100 22" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Couplers */}
    <rect x="70" y="9.5" width="4" height="3" fill="#1E293B" />
    <rect x="46" y="9.5" width="4" height="3" fill="#1E293B" />
    <rect x="22" y="9.5" width="4" height="3" fill="#1E293B" />

    {/* Locomotive Engine (Front, right side) */}
    <rect x="74" y="3" width="22" height="16" rx="3" fill="#065F46" />
    <path d="M92 3H96C98.5 3 99 7 99 11C99 15 98.5 19 96 19H92V3Z" fill="#047857" />
    <rect x="74" y="9.5" width="23" height="3" fill="#F59E0B" />
    <rect x="86" y="5" width="4" height="4" rx="1" fill="#1E293B" />
    <rect x="77" y="5" width="4" height="3" rx="0.5" fill="#1E293B" />
    <circle cx="98" cy="11" r="1.5" fill="#FEF08A" />

    {/* Bogie 1 (Coach 1) */}
    <rect x="50" y="4" width="20" height="14" rx="2" fill="#065F46" />
    <rect x="50" y="9.5" width="20" height="2.5" fill="#F59E0B" />
    <rect x="53" y="5.5" width="3" height="2.5" fill="#0F172A" />
    <rect x="58" y="5.5" width="3" height="2.5" fill="#0F172A" />
    <rect x="63" y="5.5" width="3" height="2.5" fill="#0F172A" />

    {/* Bogie 2 (Coach 2) */}
    <rect x="26" y="4" width="20" height="14" rx="2" fill="#065F46" />
    <rect x="26" y="9.5" width="20" height="2.5" fill="#F59E0B" />
    <rect x="29" y="5.5" width="3" height="2.5" fill="#0F172A" />
    <rect x="34" y="5.5" width="3" height="2.5" fill="#0F172A" />
    <rect x="39" y="5.5" width="3" height="2.5" fill="#0F172A" />

    {/* Bogie 3 (Coach 3 / Guard Van) */}
    <rect x="2" y="4" width="20" height="14" rx="2" fill="#065F46" />
    <rect x="2" y="9.5" width="20" height="2.5" fill="#F59E0B" />
    <rect x="5" y="5.5" width="3" height="2.5" fill="#0F172A" />
    <rect x="10" y="5.5" width="3" height="2.5" fill="#0F172A" />
    <rect x="15" y="5.5" width="3" height="2.5" fill="#0F172A" />
    <circle cx="2" cy="7" r="1" fill="#EF4444" />
    <circle cx="2" cy="15" r="1" fill="#EF4444" />
  </svg>
);

export const MotorcycleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 36 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="24" y="8" width="8" height="4" rx="2" fill="#0F172A" />
    <rect x="4" y="8" width="8" height="4" rx="2" fill="#0F172A" />
    <rect x="11" y="7" width="14" height="6" rx="2" fill="#EA580C" />
    <rect x="21" y="3" width="3" height="14" rx="1" fill="#334155" />
    <circle cx="16" cy="10" r="4" fill="#0284C7" />
    <circle cx="17" cy="10" r="3" fill="#F8FAFC" />
    <circle cx="31" cy="10" r="2" fill="#FEF08A" />
  </svg>
);

export const AirplaneIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Wings */}
    <path
      d="M20 10 L38 24 L34 26 L23 20 L23 30 L27 34 L25 35 L20 32 L15 35 L13 34 L17 30 L17 20 L6 26 L2 24 Z"
      fill="#CBD5E1"
      stroke="#94A3B8"
      strokeWidth="0.8"
    />
    {/* Jet Engines */}
    <rect x="25" y="21" width="3" height="6" rx="1.5" fill="#334155" />
    <rect x="12" y="21" width="3" height="6" rx="1.5" fill="#334155" />
    {/* Fuselage */}
    <path
      d="M20 4 C21.5 6 22.5 12 22.5 22 L22 34 L20 37 L18 34 L17.5 22 C17.5 12 18.5 6 20 4 Z"
      fill="#F8FAFC"
      stroke="#64748B"
      strokeWidth="0.8"
    />
    {/* Cockpit Window */}
    <path d="M19 8 C19.5 7.5 20.5 7.5 21 8 L21.5 10 L18.5 10 Z" fill="#0F172A" />
    {/* Wingtip navigation lights */}
    <circle cx="37" cy="24" r="1.2" fill="#10B981" />
    <circle cx="3" cy="24" r="1.2" fill="#EF4444" />
    {/* Tail fin red accent */}
    <rect x="19.2" y="32" width="1.6" height="4" rx="0.5" fill="#DC2626" />
  </svg>
);

