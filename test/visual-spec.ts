/// <reference path="_references.ts" />

module powerbi.extensibility.visual.test {

    describe("On the Visual class", () => {

        // define global spec variables here
        let host: IVisualHost;
        let target: HTMLElement;
        let palette: IColorPalette;
        let selectionManager: ISelectionManager;
        let tooltipService: ITooltipService;
        let locale: MockILocale;
        let allowInteractions: MockIAllowInteractions;

        beforeEach(() => {

            // mock constructor input variables
            target = document.createElement("div");
            palette = new MockIColorPalette();
            selectionManager = new MockISelectionManager();
            tooltipService = new MockITooltipService();
            locale = new MockILocale({ "en": "en-US" });
            allowInteractions = new MockIAllowInteractions(true);
            host = new MockIVisualHost(palette, selectionManager, tooltipService, locale, allowInteractions);

        });

        describe("the constructor method", () => {

            it("must create a visual with no errors", () => {

                // create the visual for testing
                let visual = new Visual({ element: target, host: host });

                // ensure it exists
                expect(visual).toBeDefined();

            });
        });
    });
}
