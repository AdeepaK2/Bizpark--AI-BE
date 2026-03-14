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
exports.AdminTemplateEntity = void 0;
const typeorm_1 = require("typeorm");
const shared_1 = require("../shared");
let AdminTemplateEntity = class AdminTemplateEntity extends shared_1.BaseEntityWithTimestamps {
};
exports.AdminTemplateEntity = AdminTemplateEntity;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], AdminTemplateEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AdminTemplateEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: shared_1.TemplateType,
        enumName: 'TemplateType',
        default: shared_1.TemplateType.SHOWCASE,
    }),
    __metadata("design:type", String)
], AdminTemplateEntity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'{}'::jsonb" }),
    __metadata("design:type", Object)
], AdminTemplateEntity.prototype, "deployment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'{}'::jsonb" }),
    __metadata("design:type", Object)
], AdminTemplateEntity.prototype, "cmsSchema", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], AdminTemplateEntity.prototype, "baseHtmlUrl", void 0);
exports.AdminTemplateEntity = AdminTemplateEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'Template' })
], AdminTemplateEntity);
