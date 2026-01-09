import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { GeoLocation, Mission } from '../types';

interface WorldMapProps {
  onSelectTarget: (location: GeoLocation) => void;
  missions: Mission[];
  onImpact: (id: string) => void;
}

const DC_COORDS: [number, number] = [-77.0369, 38.9072]; // Washington DC [lng, lat]

export const WorldMap: React.FC<WorldMapProps> = ({ onSelectTarget, missions, onImpact }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationLayerRef = useRef<SVGGElement>(null);
  const [worldData, setWorldData] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  
  // Track running animations to prevent duplicates
  const activeAnimations = useRef<Set<string>>(new Set());

  // Load Map Data
  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(response => response.json())
      .then(data => {
        setWorldData(feature(data, data.objects.countries));
      });

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Map Projection
  const { projection, pathGenerator } = useMemo(() => {
    const proj = d3.geoMercator()
      .scale(dimensions.width / 6.5) 
      .translate([dimensions.width / 2, dimensions.height / 1.5]);
    
    return {
      projection: proj,
      pathGenerator: d3.geoPath().projection(proj)
    };
  }, [dimensions]);

  // Handle Map Click
  const handleMapClick = (event: React.MouseEvent<SVGSVGElement>) => {
    // Allow clicking anytime, simply adds to the queue
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const coords = projection.invert?.([x, y]);
    if (coords) {
        // Grid sector naming
        const latZone = coords[1] > 0 ? 'N' : 'S';
        const lngZone = coords[0] > 0 ? 'E' : 'W';
        const sector = `${Math.abs(Math.floor(coords[1]))}${latZone}-${Math.abs(Math.floor(coords[0]))}${lngZone}`;
        
        onSelectTarget({
            lng: coords[0],
            lat: coords[1],
            name: `SECTOR ${sector}`
        });
    }
  };

  // --------------------------------------------------------------------------
  // ANIMATION ENGINE
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!animationLayerRef.current || !containerRef.current) return;

    const svg = d3.select(animationLayerRef.current);
    const container = d3.select(containerRef.current);

    missions.forEach(mission => {
        // 1. LAUNCH ANIMATION
        if (mission.status === 'LAUNCHING' && !activeAnimations.current.has(mission.id)) {
            activeAnimations.current.add(mission.id);

            const start = DC_COORDS;
            const end: [number, number] = [mission.target.lng, mission.target.lat];
            
            // Calculate Great Circle distance for realistic flight time
            const geoDistance = d3.geoDistance(start, end); // Returns radians
            const flightDuration = 1500 + (geoDistance * 2000); // 1.5s base + distance factor

            // Create interpolator for the path (Great Circle)
            const interpolator = d3.geoInterpolate(start, end);
            
            // Project the path into visual coordinates for SVG path
            const pathPoints = d3.range(0, 1.01, 0.01).map(t => projection(interpolator(t)));
            const lineGenerator = d3.line().curve(d3.curveBasis);
            const pathData = lineGenerator(pathPoints as any);

            if (!pathData) return;

            // Draw Trajectory Trail
            const trail = svg.append("path")
                .attr("d", pathData)
                .attr("fill", "none")
                .attr("stroke", "#ef4444")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "4,4")
                .attr("opacity", 0.3);

            // Missile Head
            const missileGroup = svg.append("g");
            
            missileGroup.append("circle")
                .attr("r", 3)
                .attr("fill", "#ffffff")
                .attr("filter", "url(#glow)");

            // Animate Missile along path
            missileGroup.transition()
                .duration(flightDuration)
                .ease(d3.easeQuadIn) // Accelerate towards impact
                .attrTween("transform", function() {
                    return function(t) {
                        // Get point along the great circle at time t
                        const coord = interpolator(t);
                        const projected = projection(coord);
                        if (!projected) return "";
                        return `translate(${projected[0]}, ${projected[1]})`;
                    };
                })
                .on("end", () => {
                    // Cleanup flight visuals
                    missileGroup.remove();
                    trail.transition().duration(1000).attr("opacity", 0).remove();
                    
                    // Trigger Impact
                    triggerExplosion(end);
                    onImpact(mission.id);
                });
        }
    });

    // 2. EXPLOSION FX FUNCTION
    const triggerExplosion = (coords: [number, number]) => {
        const center = projection(coords);
        if (!center) return;

        const [cx, cy] = center;

        // A. Screen Shake (Additive)
        const shakeIntensity = 5;
        container
            .transition().duration(50).style("transform", `translate(${Math.random()*shakeIntensity}px, ${Math.random()*shakeIntensity}px)`)
            .transition().duration(50).style("transform", `translate(-${Math.random()*shakeIntensity}px, -${Math.random()*shakeIntensity}px)`)
            .transition().duration(50).style("transform", `translate(0,0)`);

        // B. Flash (Sensor Overload)
        svg.append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", 5)
            .attr("fill", "white")
            .attr("opacity", 1)
            .transition().duration(100).ease(d3.easeExpOut)
            .attr("r", 150)
            .attr("opacity", 0.5)
            .transition().duration(200)
            .attr("opacity", 0)
            .remove();

        // C. Shockwaves
        [0, 150, 300].forEach((delay, i) => {
            svg.append("circle")
                .attr("cx", cx)
                .attr("cy", cy)
                .attr("r", 5)
                .attr("fill", "none")
                .attr("stroke", i === 0 ? "#fff" : "#fbbf24")
                .attr("stroke-width", 3 - i * 0.5)
                .transition().delay(delay).duration(1200).ease(d3.easeCubicOut)
                .attr("r", 80 + i * 20)
                .attr("stroke-width", 0)
                .attr("opacity", 0)
                .remove();
        });

        // D. Fireball
        svg.append("circle")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("r", 0)
            .style("fill", "url(#explosionGradient)")
            .transition().duration(200).ease(d3.easeExpOut)
            .attr("r", 30)
            .transition().duration(800)
            .attr("opacity", 0)
            .remove();

        // E. Debris
        for(let i=0; i<12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 40;
            svg.append("line")
                .attr("x1", cx)
                .attr("y1", cy)
                .attr("x2", cx)
                .attr("y2", cy)
                .attr("stroke", Math.random() > 0.5 ? "#fca5a5" : "#fcd34d")
                .attr("stroke-width", 2)
                .transition().duration(600).ease(d3.easeQuadOut)
                .attr("x2", cx + Math.cos(angle) * dist)
                .attr("y2", cy + Math.sin(angle) * dist)
                .transition().duration(300)
                .attr("opacity", 0)
                .remove();
        }
    };

  }, [missions, projection, onImpact]); // Re-run when missions change

  // DC Marker
  const dcPoint = projection(DC_COORDS);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-black/40 border border-green-900/50 rounded-lg overflow-hidden backdrop-blur-sm">
        {/* Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10" 
             style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

      <svg 
        ref={svgRef}
        width={dimensions.width} 
        height={dimensions.height}
        onClick={handleMapClick}
        className="w-full h-full cursor-crosshair"
      >
        <defs>
          <radialGradient id="explosionGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="20%" stopColor="#fef08a" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#ef4444" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <g className="map-layer">
          {worldData && worldData.features.map((feature: any, i: number) => (
            <path
              key={i}
              d={pathGenerator(feature) || ''}
              fill="#0f291e"
              stroke="#1e4e3b"
              strokeWidth={0.5}
              className="hover:fill-[#1a4031] transition-colors duration-200"
            />
          ))}
        </g>
        
        {/* DC Origin Marker */}
        {dcPoint && (
            <g transform={`translate(${dcPoint[0]}, ${dcPoint[1]})`}>
                <circle r={3} fill="#3b82f6" className="animate-pulse" />
                <circle r={6} fill="none" stroke="#3b82f6" strokeWidth={1} opacity={0.6} />
                <text x={10} y={4} fill="#3b82f6" fontSize="9" className="font-mono opacity-80">HQ</text>
            </g>
        )}

        {/* Dynamic Animation Layer (Missiles, Explosions) */}
        <g ref={animationLayerRef} />

        {/* Mission Markers Layer */}
        {missions.map(mission => {
            const point = projection([mission.target.lng, mission.target.lat]);
            if (!point) return null;

            const isHit = ['IMPACTED', 'ANALYZING', 'COMPLETE'].includes(mission.status);
            
            return (
                <g key={mission.id} transform={`translate(${point[0]}, ${point[1]})`}>
                    {/* Active Target Marker */}
                    {mission.status === 'ARMED' && (
                        <>
                            <line x1={-8} y1={0} x2={8} y2={0} stroke="#ef4444" strokeWidth={1} />
                            <line x1={0} y1={-8} x2={0} y2={8} stroke="#ef4444" strokeWidth={1} />
                            <circle r={12} fill="none" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 2" className="animate-spin-slow" />
                            <text x={14} y={-8} fill="#ef4444" fontSize="10" className="font-mono font-bold">LOCK</text>
                        </>
                    )}

                    {/* Impact Crater Marker */}
                    {isHit && (
                        <>
                            <circle r={6} fill="#000000" stroke="#7f1d1d" strokeWidth={2} opacity={0.8} />
                            <circle r={10} fill="none" stroke="#450a0a" strokeWidth={1} strokeDasharray="2 1" opacity={0.6} />
                            <text x={10} y={4} fill="#ef4444" fontSize="9" className="font-mono">IMPACT</text>
                        </>
                    )}
                </g>
            );
        })}

      </svg>
      
      {/* Overlay UI elements */}
      <div className="absolute top-4 left-4 text-xs text-green-500 font-mono pointer-events-none space-y-1">
        <div>PROJECTION: MERCATOR_TACTICAL</div>
        <div>TRAJECTORY_CALC: GEODESIC</div>
        <div>PHYSICS_ENGINE: ACTIVE</div>
      </div>
    </div>
  );
};
