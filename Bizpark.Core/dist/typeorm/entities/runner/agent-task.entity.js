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
exports.RunnerAgentTaskEntity = void 0;
const typeorm_1 = require("typeorm");
const shared_1 = require("../shared");
let RunnerAgentTaskEntity = class RunnerAgentTaskEntity extends shared_1.BaseEntityWithTimestamps {
};
exports.RunnerAgentTaskEntity = RunnerAgentTaskEntity;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], RunnerAgentTaskEntity.prototype, "businessId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: shared_1.OrmRunnerTaskType,
        enumName: 'agent_task_type_enum',
    }),
    __metadata("design:type", String)
], RunnerAgentTaskEntity.prototype, "taskType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: shared_1.OrmRunnerTaskStatus,
        enumName: 'agent_task_status_enum',
        default: shared_1.OrmRunnerTaskStatus.QUEUED,
    }),
    __metadata("design:type", String)
], RunnerAgentTaskEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'{}'::jsonb" }),
    __metadata("design:type", Object)
], RunnerAgentTaskEntity.prototype, "inputData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], RunnerAgentTaskEntity.prototype, "outputData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], RunnerAgentTaskEntity.prototype, "logs", void 0);
exports.RunnerAgentTaskEntity = RunnerAgentTaskEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'agent_tasks' })
], RunnerAgentTaskEntity);
