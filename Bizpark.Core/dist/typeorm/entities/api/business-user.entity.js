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
exports.ApiBusinessUserEntity = void 0;
const typeorm_1 = require("typeorm");
const shared_1 = require("../shared");
const business_entity_1 = require("./business.entity");
const user_entity_1 = require("./user.entity");
let ApiBusinessUserEntity = class ApiBusinessUserEntity {
};
exports.ApiBusinessUserEntity = ApiBusinessUserEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid' }),
    __metadata("design:type", String)
], ApiBusinessUserEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid' }),
    __metadata("design:type", String)
], ApiBusinessUserEntity.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: shared_1.UserRole,
        enumName: 'UserRole',
        default: shared_1.UserRole.EDITOR,
    }),
    __metadata("design:type", String)
], ApiBusinessUserEntity.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], ApiBusinessUserEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.ApiUserEntity, (user) => user.businesses, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.ApiUserEntity)
], ApiBusinessUserEntity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => business_entity_1.ApiBusinessEntity, (business) => business.users, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'businessId' }),
    __metadata("design:type", business_entity_1.ApiBusinessEntity)
], ApiBusinessUserEntity.prototype, "business", void 0);
exports.ApiBusinessUserEntity = ApiBusinessUserEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'BusinessUser' })
], ApiBusinessUserEntity);
