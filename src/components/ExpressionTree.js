// src/components/ExpressionTree.js
import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import * as d3 from 'd3';

const ExpressionTree = () => {
  const expressionTree = useSelector((state) => state.expressionTree);
  const svgRef = useRef();

  useEffect(() => {
    if (!expressionTree) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 500;
    const height = 500;

    const treeLayout = d3.tree().size([width - 100, height - 100]);

    const root = d3.hierarchy(expressionTree, d => {
      if (d.type === 'CallExpression') {
        return d.arguments;
      } else if (d.left || d.right) {
        return [d.left, d.right].filter(Boolean);
      }
      return [];
    });

    treeLayout(root);

    // Links
    svg
      .selectAll('line')
      .data(root.links())
      .enter()
      .append('line')
      .attr('x1', (d) => d.source.x + 50)
      .attr('y1', (d) => d.source.y + 50)
      .attr('x2', (d) => d.target.x + 50)
      .attr('y2', (d) => d.target.y + 50)
      .attr('stroke', '#555');

    // Nodes
    svg
      .selectAll('circle')
      .data(root.descendants())
      .enter()
      .append('circle')
      .attr('cx', (d) => d.x + 50)
      .attr('cy', (d) => d.y + 50)
      .attr('r', 20)
      .attr('fill', '#999');

    // Labels
    svg
      .selectAll('text')
      .data(root.descendants())
      .enter()
      .append('text')
      .attr('x', (d) => d.x + 50)
      .attr('y', (d) => d.y + 55)
      .attr('text-anchor', 'middle')
      .text((d) => {
        if (d.data.type === 'CallExpression') {
          return d.data.callee.name;
        }
        return d.data.value || d.data.name;
      });

  }, [expressionTree]);

  return <svg ref={svgRef} width="500" height="500"></svg>;
};

export default ExpressionTree;