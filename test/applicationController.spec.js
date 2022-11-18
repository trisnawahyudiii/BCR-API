const ApplicationController = require("../app/controllers/ApplicationController");
const { NotFoundError } = require("../app/errors");

describe("Application Controller", () => {
    const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };

    const mockNext = jest.fn();

    const appController = new ApplicationController();

    describe("handleGetRoot Function", () => {
        const mockRequest = {};

        it("should response with 200 as status code and should response ", () => {
            appController.handleGetRoot(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                status: "OK",
                message: "BCR API is up and running!",
            });
        });
    });

    describe("handleNotFound Function", () => {
        const mockRequest = {
            method: "GET",
            url: "abc.co.id",
        };

        const error = new NotFoundError(mockRequest.method, mockRequest.url);

        it("should throw NotFoundError with 404 as status code and should response ", () => {
            appController.handleNotFound(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: {
                    name: error.name,
                    message: error.message,
                    details: error.details,
                },
            });
        });
    });

    describe("handleError Function", () => {
        const mockRequest = {
            method: "GET",
            url: "abc.co.id",
        };

        const error = new NotFoundError(mockRequest.method, mockRequest.url);

        it("should throw an error with 500 as status code and should response ", () => {
            appController.handleError(error, mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: {
                    name: error.name,
                    message: error.message,
                    details: error.details,
                },
            });
        });
    });

    describe("getOffsetFromRequest Function", () => {
        const mockRequest = {
            query: {
                page: 2,
                pageSize: 10,
            },
        };

        it("should return a valid offset value", () => {
            const offset = appController.getOffsetFromRequest(mockRequest);

            expect(offset).toBe(10);
        });
    });

    describe("buildPaginationObject function", () => {
        const mockRequest = {
            query: {
                page: 2,
                pageSize: 10,
            },
        };

        it("should return a pagination object ", () => {
            const result = appController.buildPaginationObject(mockRequest, 20);

            expect(result).toEqual({
                page: 2,
                pageCount: 2,
                pageSize: 10,
                count: 20,
            });
        });
    });
});
