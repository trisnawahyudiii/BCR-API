const ApplicationError = require("../app/errors/ApplicationError");

describe("Application Errors", () => {
    it("should instanciate a new application error", () => {
        const message = "Application Error";

        const error = new ApplicationError(message);
        const throwErr = error.toJSON();

        expect(throwErr).toEqual(
            expect.objectContaining({
                error: expect.objectContaining({
                    name: expect.any(String),
                    message: expect.any(String),
                    details: expect.any(Object),
                }),
            })
        );
    });
});
