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
exports.ApiBusinessEntity = void 0;
const typeorm_1 = require("typeorm");
const shared_1 = require("../shared");
const business_user_entity_1 = require("./business-user.entity");
const website_entity_1 = require("./website.entity");
let ApiBusinessEntity = class ApiBusinessEntity extends shared_1.BaseEntityWithTimestamps {
};
exports.ApiBusinessEntity = ApiBusinessEntity;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ApiBusinessEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ApiBusinessEntity.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ApiBusinessEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ApiBusinessEntity.prototype, "logoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: shared_1.SubscriptionTier,
        enumName: 'business_subscription_tier_enum',
        default: shared_1.SubscriptionTier.FREE,
    }),
    __metadata("design:type", String)
], ApiBusinessEntity.prototype, "subscriptionTier", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => business_user_entity_1.ApiBusinessUserEntity, (businessUser) => businessUser.business),
    __metadata("design:type", Array)
], ApiBusinessEntity.prototype, "users", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => website_entity_1.ApiWebsiteEntity, (website) => website.business),
    __metadata("design:type", Array)
], ApiBusinessEntity.prototype, "websites", void 0);
exports.ApiBusinessEntity = ApiBusinessEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'businesses' })
], ApiBusinessEntity);
