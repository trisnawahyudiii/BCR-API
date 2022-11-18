const { Op } = require("sequelize");
const ApplicationController = require("./ApplicationController");
const { CarAlreadyRentedError, RecordNotFoundError } = require("../errors");

class CarController extends ApplicationController {
    constructor({ carModel, userCarModel, dayjs }) {
        super();
        this.carModel = carModel;
        this.userCarModel = userCarModel;
        this.dayjs = dayjs;
    }

    handleListCars = async (req, res) => {
        const offset = this.getOffsetFromRequest(req);
        const limit = req.query.pageSize;
        const query = this.getListQueryFromRequest(req);
        const cars = await this.carModel.findAll(query);
        const carCount = await this.carModel.count({ where: query.where, include: query.include });
        const pagination = this.buildPaginationObject(req, carCount);

        res.status(200).json({
            cars,
            meta: {
                pagination,
            },
        });
    };

    handleGetCar = async (req, res) => {
        const car = await this.getCarFromRequest(req);

        res.status(200).json(car);
    };

    handleCreateCar = async (req, res) => {
        try {
            const { name, price, size, image } = req.body;

            const car = await this.carModel.create({
                name,
                price,
                size,
                image,
                isCurrentlyRented: false,
            });

            res.status(201).json(car);
        } catch (err) {
            res.status(422).json({
                error: {
                    name: err.name,
                    message: err.message,
                },
            });
        }
    };

    handleRentCar = async (req, res, next) => {
        try {
            let { rentStartedAt, rentEndedAt } = req.body;
            const car = await this.getCarFromRequest(req);

            if (!rentEndedAt) rentEndedAt = this.dayjs(rentStartedAt).add(1, "day");

            const activeRent = await this.userCarModel.findOne({
                where: {
                    carId: car.id,
                    rentStartedAt: {
                        [Op.gte]: rentStartedAt,
                    },
                    rentEndedAt: {
                        [Op.lte]: rentEndedAt,
                    },
                },
            });

            if (!!activeRent) {
                const err = new CarAlreadyRentedError(car);

                res.status(422).json(err);
                return;
            }

            const userCar = await this.userCarModel.create({
                userId: req.user.id,
                carId: car.id,
                rentStartedAt,
                rentEndedAt,
            });

            res.status(201).json(userCar);
        } catch (err) {
            next(err);
        }
    };

    handleUpdateCar = async (req, res) => {
        const car = await this.getCarFromRequest(req);
        const { name, price, size, image } = req.body;

        try {
            const updatedCar = this.carModel.update(
                {
                    name,
                    price,
                    size,
                    image,
                    isCurrentlyRented: false,
                },
                {
                    where: {
                        id: car.id,
                    },
                }
            );

            if (!updatedCar) {
                throw new Error();
            }

            res.status(200).json({
                message: "Data Updated Successfully",
            });
        } catch (err) {
            res.status(422).json({
                error: {
                    name: err.name,
                    message: err.message,
                },
            });
        }
    };

    handleDeleteCar = async (req, res) => {
        const id = req.params.id;

        try {
            const deleted = this.carModel.destroy({
                where: {
                    id: id,
                },
            });

            if (!deleted) {
                throw new Error();
            }

            res.status(204).json({
                message: "delete Successfull",
            });
        } catch (err) {
            res.status(422).json({
                error: {
                    name: err.name,
                    message: err.message,
                },
            });
        }
    };

    async getCarFromRequest(req) {
        const car = await this.carModel.findByPk(req.params.id);
        return car;
    }

    getListQueryFromRequest(req) {
        const { size, availableAt } = req.query;
        const offset = this.getOffsetFromRequest(req);
        const limit = req.query.pageSize || 10;
        const where = {};
        const include = {
            model: this.userCarModel,
            as: "userCar",
            required: false,
        };

        if (!!size) where.size = size;
        if (!!availableAt) {
            include.where = {
                rentEndedAt: {
                    [Op.gte]: availableAt,
                },
            };
        }

        const query = {
            include,
            where,
            limit,
            offset,
        };

        return query;
    }
}

module.exports = CarController;
