import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const NormalDistribution = ({ mean, stddev }) => {
  const ref = useRef();

  useEffect(() => {
    const margin = { top: 50, right: 30, bottom: 50, left: 40 };
    const width = ref.current.offsetWidth - margin.left - margin.right; // Adjusted width
    const height = 500 - margin.top - margin.bottom;

    const maxY = 1 / (Math.sqrt(2 * Math.PI) * stddev);

    const x = d3.scaleLinear()
      .domain([Math.max(0, mean - 4*stddev), mean + 4*stddev])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, maxY])
      .range([height, 0]);

    const line = d3.line()
      .x(d => x(d.x))
      .y(d => y(d.y));

    const data = d3.range(Math.max(0, mean - 4*stddev), mean + 4*stddev, 0.01).map(x => ({
      x,
      y: (1 / (Math.sqrt(2 * Math.PI * Math.pow(stddev, 2)))) * 
         (Math.pow(Math.E, -(Math.pow(x - mean, 2) / (2 * Math.pow(stddev, 2))))),
    }));

    d3.select(ref.current).select("svg").remove();

    const svg = d3.select(ref.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    svg.append("defs").selectAll("marker")
      .data(["end", "start"])
      .enter().append("marker")
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", d => d === "end" ? 10 : 0)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", d => d === "end" ? "M0,-5L10,0L0,5" : "M10,-5L0,0L10,5");

    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", line);

    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x));
    svg.append("g")
      .call(d3.axisLeft(y));

    svg.append("text")             
      .attr("transform", `translate(${width/2} ,${height + margin.top -10})`)
      .style("text-anchor", "middle")
      .text("Task Time (minutes)");


    const ruleValues = [68, 95, 99.7];
    const positions = [0.25, 0.5, 0.75]; 

    for (let i = 0; i <= 2; i++) {
      if (mean - (i + 1) * stddev > 0) {
        svg.append("line")
          .style("stroke", "red")
          .style("stroke-dasharray", ("3, 3"))
          .attr("x1", x(mean + (i + 1) * stddev))
          .attr("y1", 0)
          .attr("x2", x(mean + (i + 1) * stddev))
          .attr("y2", height);
        svg.append("line")
          .style("stroke", "red")
          .style("stroke-dasharray", ("3, 3"))
          .attr("x1", x(mean - (i + 1) * stddev))
          .attr("y1", 0)
          .attr("x2", x(mean - (i + 1) * stddev))
          .attr("y2", height);
        svg.append("line")
          .style("stroke", "black")
          .attr("marker-start", "url(#start)")
          .attr("marker-end", "url(#end)") 
          .attr("x1", x(mean - (i + 1) * stddev))
          .attr("y1", height * positions[i])
          .attr("x2", x(mean + (i + 1) * stddev))
          .attr("y2", height * positions[i]);
        svg.append("text")
          .attr("x", x(mean))
          .attr("y", height * positions[i] + 20)
          .style("text-anchor", "middle")
          .text(`${ruleValues[i]}% within ${Math.floor(mean - (i + 1) * stddev)}-${Math.ceil(mean + (i + 1) * stddev)} minutes`);
      }
    }
  }, [mean, stddev]);

  return (
    // <div ref={ref} />
        <div ref={ref} style={{ width: '100%', maxWidth: '800px' }} />

  );
};

export default NormalDistribution;