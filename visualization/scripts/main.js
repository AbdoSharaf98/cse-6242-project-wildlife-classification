d3.csv('data/sample.csv').then(function(sampleData) {
    d3.json('data/gps_locations.json').then(function(gpsData) {
        d3.csv('data/categories.csv').then(function(categoryData) {
            processData(sampleData, gpsData, categoryData);
        });
    });
});

function processData(sampleData, gpsData, categoryData) {
    let categoryLookup = {};
    categoryData.forEach(d => categoryLookup[d.category_id] = d.name);

    let locationStats = {};
    sampleData.forEach(d => {
        // Check if GPS data exists
        if (gpsData[d.location]) {
            if (!locationStats[d.location]) {
                locationStats[d.location] = { total_images: 0, categories: {}, coordinates: gpsData[d.location] };
            }
            locationStats[d.location].total_images++;
            let categoryName = categoryLookup[d.category_id];
            locationStats[d.location].categories[categoryName] = (locationStats[d.location].categories[categoryName] || 0) + 1;
        }
    });

    createMap(Object.values(locationStats));
}

function createMap(locations) {
    var width = 940, height = 974;

    var svg = d3.select('#map').append('svg')
                .attr('width', width)
                .attr('height', height)
                .attr('fill', '#acdf87');

    svg.append('rect')
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('fill', '#3b6c8c');

    var g = svg.append('g');

    var projection = d3.geoNaturalEarth1()
                       .scale(180)
                       .translate([width / 2, height / 2]);

    var path = d3.geoPath().projection(projection);

    var zoom = d3.zoom()
                 .scaleExtent([1, 50])
                 .on('zoom', (event) => {
                     g.attr('transform', event.transform);
                     g.selectAll("circle")
                        .attr("r", (10 / event.transform.k))
                        .attr('stroke-width', (10 / event.transform.k) / 8)
                 });

    svg.call(zoom);

    d3.json('https://enjalot.github.io/wwsd/data/world/world-110m.geojson').then(function(world) {
        g.selectAll('path')
           .data(world.features)
           .enter().append('path')
           .attr('d', path);

        g.selectAll('circle')
           .data(locations)
           .enter().append('circle')
           .attr('cx', d => projection([d.coordinates.longitude, d.coordinates.latitude])[0])
           .attr('cy', d => projection([d.coordinates.longitude, d.coordinates.latitude])[1])
           .attr('r', 10)
           .style('fill', 'red')
           .style('stroke', 'white')
           .style('stoke-width', 10/8)
           .on('click', (event, d) => {
               if (!d.coordinates) {
                   console.error('Missing coordinates for this location:', d);
                   return; // Exit if coordinates are missing
               }
               showStats(d);
               createBarChart(d);
           });
    });
}



function showStats(locationData) {
    var locationLat = (locationData.coordinates.latitude).toFixed(2);
    var locationLon = (locationData.coordinates.longitude).toFixed(2);

    var statsDiv = d3.select('#stats');

    statsDiv.html('');
    statsDiv.append('p').text(`Location: (${locationLat}, ${locationLon})`);
    statsDiv.append('p').text(`${locationData.total_images} Images`);
    statsDiv.append('p').text(`${Object.keys(locationData.categories).length} Species`);
}

function createBarChart(locationData) {
    // Clear any existing chart
    d3.select('#bar-chart').selectAll('*').remove();

    var barDiv = d3.select('#bar-chart');

    barDiv.append('h1').text('Identified species');
    barDiv.append('h2').text('Count of images per species');

    // Define dimensions and margins
    const barChartDiv = document.getElementById('bar-chart');
    const margin = { top: 20, right: 50, bottom: 20, left: 180 };
    const width = barChartDiv.clientWidth - margin.left - margin.right;
    const height = barChartDiv.clientHeight - margin.top - margin.bottom;

    // Set a fixed bar height
    const barHeight = 35; 
    const barPadding = 5;

    // Create SVG container
    const svg = d3.select('#bar-chart').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Extract categories and counts
    const categories = Object.keys(locationData.categories);
    const counts = categories.map(category => locationData.categories[category]);

    // Create scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(counts)])
        .range([0, width]);

    const y = d3.scaleBand()
        .range([0, categories.length * (barHeight + barPadding)])
        .domain(categories)
        .paddingInner(0.1);

    svg.append('p').text('Identified species');

    // Draw bars
    svg.selectAll('rect')
        .data(categories)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (d, i) => i * (barHeight + barPadding))
        .attr('width', d => x(locationData.categories[d]))
        .attr('height', barHeight)
        .attr('fill', '#69b3a2');

    // Add count labels
    svg.selectAll('text.value-label')
        .data(categories)
        .enter()
        .append('text')
        .attr('class', 'value-label')
        .attr('x', d => x(locationData.categories[d]) + 5) // Position label slightly right of the bar end
        .attr('y', (d, i) => i * (barHeight + barPadding) + barHeight / 2 + 5)
        .text(d => locationData.categories[d]);

    // Add category labels
    svg.selectAll('text.category-label')
        .data(categories)
        .enter()
        .append('text')
        .attr('class', 'category-label')
        .attr('x', -5)
        .attr('y', (d, i) => i * (barHeight + barPadding) + barHeight / 2 + 5)
        .attr('text-anchor', 'end')
        .text(d => d);
}






