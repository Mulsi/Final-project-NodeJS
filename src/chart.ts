///{} <reference path="https://www.igniteui.com/js/typings/jquery.d.ts" />
///{} <reference path="https://www.igniteui.com/js/typings/jqueryui.d.ts" />
///{} <reference path="https://www.igniteui.com/js/typings/igniteui.d.ts" />

class CountryPopulation {
    countryName: string;
    population2005: number;
    population1995: number;
    constructor(inName: string, populationIn1995: number, populationIn2005: number) {
        this.countryName = inName;
        this.population2005 = populationIn2005;
        this.population1995 = populationIn1995;
    }

}

var samplePopulation: CountryPopulation[] = [];
samplePopulation.push(new CountryPopulation("China", 1216,  1297));
samplePopulation.push(new CountryPopulation("India", 920, 1090));
samplePopulation.push(new CountryPopulation("United States", 266, 295));
samplePopulation.push(new CountryPopulation("Indonesia", 197, 229));
samplePopulation.push(new CountryPopulation("Brazil", 161, 186));


interface JQuery {
    igDataChart():void;
}

$(function () {
    (<any>$("#data-chart")).igDataChart({
        width: "80%",
        height: "400px",
        title: "Population per Country",
        subtitle: "Five largest projected populations for 1995 and 2005",
        dataSource: samplePopulation,
        axes: [
            {
                name: "NameAxis",
                type: "categoryX",
                title: "Country",
                label: "countryName"
            },
            {
                name: "PopulationAxis",
                type: "numericY",
                minimumValue: 0,
                title: "Millions of People",
            }
        ],
        series: [
            {
                name: "1995Population",
                title: "1995",
                type: "column",
                isDropShadowEnabled: true,
                useSingleShadow: false,
                shadowColor: "#666666",
                isHighlightingEnabled: true,
                isTransitionInEnabled: true,
                xAxis: "NameAxis",
                yAxis: "PopulationAxis",
                valueMemberPath: "population1995",
                showTooltip: true
            },
            {
                name: "2005Population",
                title: "2005",
                type: "column",
                isDropShadowEnabled: true,
                useSingleShadow: false,
                shadowColor: "#666666",
                isHighlightingEnabled: true,
                isTransitionInEnabled: true,
                xAxis: "NameAxis",
                yAxis: "PopulationAxis",
                valueMemberPath: "population2005",
                showTooltip: true
            },
            {
                name: "categorySeries",
                type: "categoryToolTipLayer",
                useInterpolation: false,
                transitionDuration: 150
            },
            {
                name: "crosshairLayer",
                title: "crosshair",
                type: "crosshairLayer",
                useInterpolation: false,
                transitionDuration: 500
            }
        ]
    });
})