const AuthenticationController = require("../app/controllers/AuthenticationController");
const { User, Role } = require("../app/models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { WrongPasswordError, EmailNotRegisteredError, EmailAlreadyTakenError, RecordNotFoundError } = require("../app/errors");
const { JWT_SIGNATURE_KEY } = require("../config/application");

describe("Authentication Controller", () => {
    describe("Constructor", () => {
        it("should create a new authController with userModel setted ", () => {
            const userModel = {};
            const roleModel = {};
            const bcrypt = {};
            const jwt = {};
            const authenticationController = new AuthenticationController({ userModel, roleModel, bcrypt, jwt });
            expect(authenticationController.userModel).toBe(userModel);
        });
    });

    describe("Authorize Function", () => {
        const mockUser = new User({
            id: 1,
            name: "TestUser",
            email: "testuser@binar.co.id",
            encryptedPassword: bcrypt.hashSync("password", 10),
            roleId: 1,
        });

        const mockRole = new Role({
            id: 1,
            name: "CUSTOMER",
        });

        const mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        const mockNext = jest.fn();

        const authController = new AuthenticationController({
            userModel: mockUser,
            roleModel: mockRole,
            bcrypt,
            jwt,
        });

        // success authorization
        it("Should call the next() function 1 times ", () => {
            const mockRequest = {
                headers: {
                    authorization: `Bearer ${jwt.sign(
                        {
                            id: mockUser.id,
                            name: mockUser.name,
                            email: mockUser.email,
                            image: mockUser.image,
                            role: {
                                id: mockRole.id,
                                name: mockRole.name,
                            },
                        },
                        JWT_SIGNATURE_KEY
                    )}`,
                },
            };

            authController.authorize("CUSTOMER")(mockRequest, mockResponse, mockNext);

            expect(mockNext).toBeCalledTimes(1);
        });

        // 401 response when jwt is not provided
        it("Should throw insuficentAccess Error with 401 as status code and should response ", () => {
            const mockRequest = {
                headers: {
                    authorization: "Bearer",
                },
            };

            authController.authorize("CUSTOMER")(mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: {
                    name: "JsonWebTokenError",
                    message: "jwt must be provided",
                    details: null,
                },
            });
        });

        // 401 response when access denied
        it("Should throw insuficentAccess Error with 401 as status code and should response ", () => {
            const mockRequest = {
                headers: {
                    authorization: `Bearer ${jwt.sign(
                        {
                            id: mockUser.id,
                            name: mockUser.name,
                            email: mockUser.email,
                            image: mockUser.image,
                            role: {
                                id: mockRole.id,
                                name: mockRole.name,
                            },
                        },
                        JWT_SIGNATURE_KEY
                    )}`,
                },
            };

            authController.authorize("Admin")(mockRequest, mockResponse, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: {
                    name: "Error",
                    message: "Access forbidden!",
                    details: {
                        role: "CUSTOMER",
                        reason: "CUSTOMER is not allowed to perform this operation.",
                    },
                },
            });
        });
    });

    describe("Handle Login function", () => {
        const mockUser = new User({
            id: 1,
            name: "TestUser",
            email: "testuser@binar.co.id",
            encryptedPassword: bcrypt.hashSync("password", 10),
            roleId: 1,
        });

        const mockRole = new Role({
            id: 1,
            name: "CUSTOMER",
        });

        const mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        const mockNext = jest.fn();

        // success login attempt
        it("should retrieve accessToken and response with 201 as status code ", async () => {
            const mockUserModel = {
                findOne: jest.fn().mockReturnValue({
                    ...mockUser.dataValues,
                    Role: mockRole,
                }),
            };

            const mockRequest = {
                body: {
                    email: "testuser@binar.co.id",
                    password: "password",
                },
            };

            const authController = new AuthenticationController({
                userModel: mockUserModel,
                roleModel: mockRole,
                bcrypt,
                jwt,
            });

            await authController.handleLogin(mockRequest, mockResponse, mockNext);

            expect(mockUserModel.findOne).toHaveBeenCalledWith({
                where: {
                    email: mockRequest.body.email,
                },
                include: [
                    {
                        model: mockRole,
                        attributes: ["id", "name"],
                    },
                ],
            });

            expect(mockResponse.status).toHaveBeenCalledWith(201);

            expect(mockResponse.json).toHaveBeenCalledWith({
                accessToken: expect.any(String),
            });
        });

        // login attempt with wrong password
        it("should throw WrongPasswordError with 401 as status code and should response ", async () => {
            const mockUserModel = {
                findOne: jest.fn().mockReturnValue({
                    ...mockUser.dataValues,
                    Role: mockRole,
                }),
            };

            const mockRequest = {
                body: {
                    email: "testuser@binar.co.id",
                    password: "false",
                },
            };

            const authController = new AuthenticationController({
                userModel: mockUserModel,
                roleModel: mockRole,
                bcrypt,
                jwt,
            });

            const error = new WrongPasswordError();

            await authController.handleLogin(mockRequest, mockResponse, mockNext);

            expect(mockUserModel.findOne).toHaveBeenCalledWith({
                where: {
                    email: mockRequest.body.email,
                },
                include: [
                    {
                        model: mockRole,
                        attributes: ["id", "name"],
                    },
                ],
            });

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith(error);
        });

        // login attempt with unregistered account
        it("should throw EmailNotRegistered Error with 404 as status code ", async () => {
            const mockUserModel = {
                findOne: jest.fn().mockReturnValue(null),
            };

            const mockRequest = {
                body: {
                    email: "false@binar.co.id",
                    password: "false",
                },
            };

            const authController = new AuthenticationController({
                userModel: mockUserModel,
                roleModel: mockRole,
                bcrypt,
                jwt,
            });

            const error = new EmailNotRegisteredError(mockRequest.body.email);

            await authController.handleLogin(mockRequest, mockResponse, mockNext);

            expect(mockUserModel.findOne).toHaveBeenCalledWith({
                where: {
                    email: mockRequest.body.email,
                },
                include: [
                    {
                        model: mockRole,
                        attributes: ["id", "name"],
                    },
                ],
            });

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith(error);
        });
    });

    describe("Handle Register Function", () => {
        const mockUser = new User({
            id: 1,
            name: "TestUser",
            email: "testuser@binar.co.id",
            encryptedPassword: bcrypt.hashSync("password", 10),
            roleId: 1,
        });

        const mockRole = new Role({
            id: 1,
            name: "CUSTOMER",
        });

        const mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        const mockNext = jest.fn();

        // response 201 when succes register attempted
        it("should retrieve a valid accessToken and should response with 201 as status code ", async () => {
            const mockUserModel = {
                findOne: jest.fn().mockReturnValue(null),
                create: jest.fn().mockReturnValue(mockUser),
            };

            const mockRoleModel = {
                findOne: jest.fn().mockReturnValue(mockRole.name),
            };

            const mockRequest = {
                body: {
                    name: "validUserLogin",
                    email: "validuserlogin@binar.co.id",
                    password: "password",
                },
            };

            const authController = new AuthenticationController({
                userModel: mockUserModel,
                roleModel: mockRoleModel,
                bcrypt,
                jwt,
            });

            await authController.handleRegister(mockRequest, mockResponse, mockNext);

            expect(mockUserModel.findOne).toHaveBeenCalledWith({
                where: {
                    email: mockRequest.body.email,
                },
            });

            expect(mockRoleModel.findOne).toHaveBeenCalledWith({
                where: { name: mockRole.name },
            });

            expect(mockUserModel.create).toBeCalledTimes(1);

            expect(mockResponse.status).toHaveBeenCalledWith(201);

            expect(mockResponse.json).toHaveBeenCalledWith({
                accessToken: expect.any(String),
            });
        });

        // response 422
        it("should throw EmailAlreadyRegistered Error with 422 as status code ", async () => {
            const mockUserModel = {
                findOne: jest.fn().mockReturnValue({
                    ...mockUser.dataValues,
                    Role: mockRole,
                }),
            };

            const mockRequest = {
                body: {
                    name: "TestUser",
                    email: "testuser@binar.co.id",
                    password: "password",
                },
            };

            const error = new EmailAlreadyTakenError(mockRequest.body.email);

            const authController = new AuthenticationController({
                userModel: mockUserModel,
                roleModel: mockRole,
                bcrypt,
                jwt,
            });

            await authController.handleRegister(mockRequest, mockResponse, mockNext);

            // expect userModel findOne method
            expect(mockUserModel.findOne).toHaveBeenCalledWith({
                where: { email: mockRequest.body.email },
            });

            // expect response statusCode and JSON return value
            expect(mockResponse.status).toHaveBeenCalledWith(422);
            expect(mockResponse.json).toHaveBeenCalledWith(error);
        });
    });

    describe("HandleGetUser Function", () => {
        const mockUser = new User({
            id: 1,
            name: "TestUser",
            email: "testuser@binar.co.id",
            encryptedPassword: bcrypt.hashSync("password", 10),
            roleId: 1,
        });

        const mockRole = new Role({
            id: 1,
            name: "CUSTOMER",
        });

        const mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        // response 200
        it("should retrieve an user data and should response with 200 as status code", async () => {
            const mockUserModel = {
                ...mockUser.dataValues,
                findByPk: jest.fn().mockReturnValue(mockUser),
            };

            const mockRoleModel = {
                ...mockRole.dataValues,
                findByPk: jest.fn().mockReturnValue(mockRole),
            };

            const mockRequest = {
                user: mockUser,
            };

            const authController = new AuthenticationController({
                userModel: mockUserModel,
                roleModel: mockRoleModel,
                bcrypt,
                jwt,
            });

            await authController.handleGetUser(mockRequest, mockResponse);

            expect(mockUserModel.findByPk).toHaveBeenCalledWith(mockRequest.user.id);
            expect(mockRoleModel.findByPk).toHaveBeenCalledWith(mockRequest.user.roleId);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
        });

        // response 404 when the user can't be found
        it("should throw RecordNotFound error and should response with 404 as status code", async () => {
            const mockUserModel = {
                ...mockUser.dataValues,
                findByPk: jest.fn().mockReturnValue(null),
            };

            const mockRoleModel = {
                ...mockRole.dataValues,
                findByPk: jest.fn().mockReturnValue(null),
            };

            const mockRequest = {
                user: {
                    id: 999,
                },
            };

            const authController = new AuthenticationController({
                userModel: mockUserModel,
                roleModel: mockRoleModel,
                bcrypt,
                jwt,
            });

            const error = new RecordNotFoundError(mockUserModel.name);

            await authController.handleGetUser(mockRequest, mockResponse);

            expect(mockUserModel.findByPk).toHaveBeenCalledWith(mockRequest.user.id);
            expect(mockRoleModel.findByPk).toBeCalledTimes(0);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith(error);
        });

        // response 404 when the role cant be found
        it("should throw RecordNotFound error and should response with 404 as status code", async () => {
            const mockUserModel = {
                ...mockUser.dataValues,
                findByPk: jest.fn().mockReturnValue(mockUser),
            };

            const mockRoleModel = {
                ...mockRole.dataValues,
                findByPk: jest.fn().mockReturnValue(null),
            };

            const mockRequest = {
                user: {
                    id: mockUser.id,
                    roleId: 1,
                },
            };

            const authController = new AuthenticationController({
                userModel: mockUserModel,
                roleModel: mockRoleModel,
                bcrypt,
                jwt,
            });

            const error = new RecordNotFoundError(mockRoleModel.name);

            await authController.handleGetUser(mockRequest, mockResponse);

            expect(mockUserModel.findByPk).toHaveBeenCalledWith(mockRequest.user.id);
            expect(mockRoleModel.findByPk).toHaveBeenCalledWith(mockRequest.user.roleId);
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith(error);
        });
    });
});
