const { Op } = require("sequelize");
const dayjs = require("dayjs");
const CarController = require("../CarController");
const { Car, UserCar } = require("../../models");
const { CarAlreadyRentedError } = require("../../errors");

describe("Car Controller", () => {
    describe("Constructor", () => {
        it("should create a new carController with carModel setted", () => {
            const carModel = {};
            const userCarModel = {};

            const carController = new CarController({ carModel, userCarModel, dayjs });

            expect(carController.carModel).toBe(carModel);
            expect(carController.userCarModel).toBe(userCarModel);
            expect(carController.dayjs).toBe(dayjs);
        });
    });

    const mockCarData = {
        name: "Mazda RX-",
        price: "300000",
        size: "SMALL",
        image: "https://source.unsplash.com/500x500",
        isCurrentlyRented: false,
        createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    };

    const listCar = [];

    for (let i = 0; i < 5; i++) {
        const car = new Car({
            name: `${mockCarData.name}${i}`,
            price: mockCarData.price,
            size: mockCarData.size,
            image: mockCarData.image,
            isCurrentlyRented: mockCarData.isCurrentlyRented,
            createdAt: mockCarData.createdAt,
            updatedAt: mockCarData.updatedAt,
        });
        listCar.push(car);
    }

    const mockCarModel = {
        findAll: jest.fn().mockReturnValue(listCar),
        count: jest.fn().mockReturnValue(5),
    };

    const mockUserCarModel = new UserCar({
        userId: 1,
        carId: 1,
    });

    const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };

    describe("handleListCar Function", () => {
        const carController = new CarController({
            carModel: mockCarModel,
            userCarModel: mockUserCarModel,
            dayjs,
        });

        it("should retrieve list of cars and should response with 200 as status code and should response ", async () => {
            const mockRequest = {
                query: {},
            };
            await carController.handleListCars(mockRequest, mockResponse);

            expect(mockCarModel.findAll).toHaveBeenCalled();
            expect(mockCarModel.count).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                cars: listCar,
                meta: {
                    pagination: {
                        page: 1,
                        pageCount: 1,
                        pageSize: 10,
                        count: 5,
                    },
                },
            });
        });
    });

    describe("handleGetCar Function", () => {
        const mockCar = new Car({
            id: 1,
            name: "Mazda RX-1",
            price: "300000",
            size: "SMALL",
            image: "https://source.unsplash.com/500x500",
            isCurrentlyRented: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const mockCarModel = {
            findByPk: jest.fn().mockReturnValue(mockCar),
        };

        const mockUserCarModel = new UserCar({
            userId: 1,
            carId: 1,
            rentStartedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            rentEndedAt: dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss"),
            createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        });

        const carController = new CarController({
            carModel: mockCarModel,
            userCarModel: mockUserCarModel,
            dayjs,
        });

        it("should retrieve a car data and should response with 200 as status code", async () => {
            const mockRequest = {
                params: {
                    id: 1,
                },
            };

            await carController.handleGetCar(mockRequest, mockResponse);

            expect(mockCarModel.findByPk).toHaveBeenCalledWith(mockRequest.params.id);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockCar);
        });
    });

    describe("handleCreateCar Function", () => {
        const mockCarData = new Car({
            id: 1,
            name: "Mazda RX-1",
            price: "300000",
            size: "SMALL",
            image: "https://source.unsplash.com/500x500",
            isCurrentlyRented: false,
            createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        });

        const mockCarModel = {
            create: jest.fn().mockReturnValue(mockCarData),
        };

        const mockUserCarModel = new UserCar({
            userId: 1,
            carId: 1,
            rentStartedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            rentEndedAt: dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss"),
            createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        });

        const carController = new CarController({
            carModel: mockCarModel,
            userCarModel: mockUserCarModel,
            dayjs,
        });

        // response 201
        it("should create and retrieve a new car data and should response with 201 as status code", async () => {
            const mockRequest = {
                body: {
                    name: "Mazda RX-1",
                    price: "300000",
                    size: "SMALL",
                    image: "https://source.unsplash.com/500x500",
                    isCurrentlyRented: false,
                },
            };

            await carController.handleCreateCar(mockRequest, mockResponse);

            expect(mockCarModel.create).toHaveBeenCalledWith(mockRequest.body);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(mockCarData);
        });

        // response 422
        it("should throw an error with 422 as status code", async () => {
            const mockRequest = {};

            await carController.handleCreateCar(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(422);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: {
                    name: expect.any(String),
                    message: expect.any(String),
                },
            });
        });
    });

    describe("handleRentCar Funtion", () => {
        const mockCarData = new Car({
            // id: 1,
            name: "Mazda RX-1",
            price: "300000",
            size: "SMALL",
            image: "https://source.unsplash.com/500x500",
            isCurrentlyRented: false,
            createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        });

        const mockUserCarData = new UserCar({
            userId: 1,
            carId: 1,
            rentStartedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            rentEndedAt: dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss"),
        });

        const mockNext = jest.fn();

        // response 201
        it("should return a valid userCar data and should response with 201 as status code ", async () => {
            const mockCarModel = {
                findByPk: jest.fn().mockReturnValue(mockCarData),
            };

            const mockUserCarModel = {
                findOne: jest.fn().mockReturnValue(null),
                create: jest.fn().mockReturnValue(mockUserCarData),
            };

            const mockRequest = {
                body: {
                    rentStartedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                    rentEndedAt: dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss"),
                },
                params: {
                    id: 1,
                },
                user: {
                    id: 1,
                },
            };

            const carController = new CarController({
                carModel: mockCarModel,
                userCarModel: mockUserCarModel,
                dayjs,
            });

            await carController.handleRentCar(mockRequest, mockResponse, mockNext);

            expect(mockCarModel.findByPk).toHaveBeenCalledWith(mockRequest.params.id);
            expect(mockUserCarModel.findOne).toHaveBeenCalledWith({
                where: {
                    carId: mockCarData.id,
                    rentStartedAt: {
                        [Op.gte]: mockRequest.body.rentStartedAt,
                    },
                    rentEndedAt: {
                        [Op.lte]: mockRequest.body.rentEndedAt,
                    },
                },
            });
            expect(mockUserCarModel.create).toHaveBeenCalledWith({
                userId: mockRequest.user.id,
                carId: mockCarData.id,
                rentStartedAt: mockRequest.body.rentStartedAt,
                rentEndedAt: mockRequest.body.rentEndedAt,
            });

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(mockUserCarData);
        });

        // 422 response
        it("should throw CarAlreadyRentedError and should response with 422 as status code ", async () => {
            const mockCarModel = {
                findByPk: jest.fn().mockReturnValue(mockCarData),
            };

            const mockUserCarModel = {
                findOne: jest.fn().mockReturnValue(mockUserCarData),
            };

            const mockRequest = {
                body: {
                    rentStartedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                    rentEndedAt: dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss"),
                },
                params: {
                    id: 1,
                },
                user: {
                    id: 1,
                },
            };

            const error = new CarAlreadyRentedError(mockCarData);

            const carController = new CarController({
                carModel: mockCarModel,
                userCarModel: mockUserCarModel,
                dayjs,
            });

            await carController.handleRentCar(mockRequest, mockResponse, mockNext);

            expect(mockCarModel.findByPk).toHaveBeenCalledWith(mockRequest.params.id);
            expect(mockUserCarModel.findOne).toHaveBeenCalledWith({
                where: {
                    carId: mockCarData.id,
                    rentStartedAt: {
                        [Op.gte]: mockRequest.body.rentStartedAt,
                    },
                    rentEndedAt: {
                        [Op.lte]: mockRequest.body.rentEndedAt,
                    },
                },
            });

            expect(mockResponse.status).toHaveBeenCalledWith(422);
            expect(mockResponse.json).toHaveBeenCalledWith(error);
        });

        // 422 response with catcs
        it("should throw CarAlreadyRentedError and should response with 422 as status code ", async () => {
            const mockCarModel = {};

            const mockUserCarModel = {
                findOne: jest.fn().mockReturnValue(mockUserCarData),
            };

            const mockRequest = {
                body: {
                    rentStartedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                    rentEndedAt: dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss"),
                },
                params: {
                    id: 1,
                },
                user: {
                    id: 1,
                },
            };

            const error = new CarAlreadyRentedError(mockCarData);

            const carController = new CarController({
                carModel: mockCarModel,
                userCarModel: mockUserCarModel,
                dayjs,
            });

            await carController.handleRentCar(mockRequest, mockResponse, mockNext);

            expect(mockNext).toHaveBeenCalledTimes(1);
        });
    });
});
