module powerbi.extensibility.visual {

    interface DataPoint {
        category: string;
        value: number;
        colour: string;
        identity: powerbi.visuals.ISelectionId;
        highlighted: boolean;
    };

    interface ViewModel {
        dataPoints: DataPoint[];
        maxValue: number;
        highlights: boolean;
    };

    export class Visual implements IVisual {

        private host: IVisualHost;
        private svg: d3.Selection<SVGElement>;
        private barGroup: d3.Selection<SVGElement>;
        private xPadding: number = 0.1;
        private selectionManager: ISelectionManager;
        private xAxisGroup: d3.Selection<SVGElement>;
        private yAxisGroup: d3.Selection<SVGElement>;

        private settings = {
            axis: {
                x: {
                    padding: 50
                },
                y: {
                    padding: 50
                }
            },
            border: {
                top: 10
            }
        }

        constructor(options: VisualConstructorOptions) {
            this.host = options.host;
            this.svg = d3.select(options.element)
                .append("svg")
                .classed("my-little-bar-chart", true);
            this.barGroup = this.svg.append("g")
                .classed("bar-group", true);

            this.xAxisGroup = this.svg.append("g")
                .classed("x-axis", true);

            this.yAxisGroup = this.svg.append("g")
                .classed("y-axis", true);

            this.selectionManager = this.host.createSelectionManager();
        }

        public update(options: VisualUpdateOptions) {

            let viewModel = this.getViewModel(options);

            let width = options.viewport.width;
            let height = options.viewport.height;

            this.svg.attr({
                width: width,
                height: height
            });

            let yScale = d3.scale.linear()
                .domain([0, viewModel.maxValue])
                .range([height - this.settings.axis.x.padding, 0 + this.settings.border.top]);

            let yAxis = d3.svg.axis()
                .scale(yScale)
                .orient("left")
                .tickSize(1);

            this.yAxisGroup
                .call(yAxis)
                .attr({
                    transform: "translate(" + this.settings.axis.y.padding + ",0)"
                })
                .style({
                    fill: "#777777"
                })
                .selectAll("text")
                .style({
                    "text-anchor": "end",
                    "font-size": "x-small"
                });

            let xScale = d3.scale.ordinal()
                .domain(viewModel.dataPoints.map(d => d.category))
                .rangeRoundBands([this.settings.axis.y.padding, width], this.xPadding);

            let xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom")
                .tickSize(1);

            this.xAxisGroup
                .call(xAxis)
                .attr({
                    transform: "translate(0, " + (height - this.settings.axis.x.padding) + ")"
                })
                .style({
                    fill: "#777777"
                })
                .selectAll("text")
                .attr({
                    transform: "rotate(-35)"
                })
                .style({
                    "text-anchor": "end",
                    "font-size": "x-small"
                });

            let bars = this.barGroup
                .selectAll(".bar")
                .data(viewModel.dataPoints);

            bars.enter()
                .append("rect")
                .classed("bar", true);

            bars
                .attr({
                    width: xScale.rangeBand(),
                    height: d => height - yScale(d.value) - this.settings.axis.x.padding,
                    y: d => yScale(d.value),
                    x: d => xScale(d.category)
                })
                .style({
                    fill: d => d.colour,
                    "fill-opacity": d => viewModel.highlights ? d.highlighted ? 1.0 : 0.5 : 1.0
                })
                .on("click", (d) => {
                    this.selectionManager
                        .select(d.identity, true)
                        .then(ids => {
                            bars.style({
                                "fill-opacity": d =>
                                    ids.length > 0 ?
                                        ids.indexOf(d.identity) >= 0 ?
                                            1.0 :
                                            0.5 :
                                        1.0
                            });
                        });
                });

            bars.exit()
                .remove();
        }

        private getViewModel(options: VisualUpdateOptions): ViewModel {

            let dv = options.dataViews;

            let viewModel: ViewModel = {
                dataPoints: [],
                maxValue: 0,
                highlights: false
            };

            if (!dv
                || !dv[0]
                || !dv[0].categorical
                || !dv[0].categorical.categories
                || !dv[0].categorical.categories[0].source
                || !dv[0].categorical.values)
                return viewModel;

            let view = dv[0].categorical;
            let categories = view.categories[0];
            let values = view.values[0];
            let highlights = values.highlights;

            for (let i = 0, len = Math.max(categories.values.length, values.values.length); i < len; i++) {
                viewModel.dataPoints.push({
                    category: <string>categories.values[i],
                    value: <number>values.values[i],
                    colour: this.host.colorPalette.getColor(<string>categories.values[i]).value,
                    identity: this.host.createSelectionIdBuilder()
                        .withCategory(categories, i)
                        .createSelectionId(),
                    highlighted: highlights ? highlights[i] ? true : false : false
                });
            }

            viewModel.maxValue = d3.max(viewModel.dataPoints, d => d.value);
            viewModel.highlights = viewModel.dataPoints.filter(d => d.highlighted).length > 0;

            return viewModel;
        }
    }
}