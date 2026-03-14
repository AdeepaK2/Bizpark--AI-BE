"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiUserEntity = void 0;
const typeorm_1 = require("typeorm");
const shared_1 = require("../shared");
const business_user_entity_1 = require("./business-user.entity");
let ApiUserEntity = class ApiUserEntity extends shared_1.BaseEntityWithTimestamps {
};
exports.ApiUserEntity = ApiUserEntity;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], ApiUserEntity.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ApiUserEntity.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ApiUserEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => business_user_entity_1.ApiBusinessUserEntity, (businessUser) => businessUser.user),
    __metadata("design:type", Array)
], ApiUserEntity.prototype, "businesses", void 0);
exports.ApiUserEntity = ApiUserEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'users' })
], ApiUserEntity);
