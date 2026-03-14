"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrmRunnerTaskType = exports.OrmRunnerTaskStatus = exports.OrmTemplateType = exports.OrmSubscriptionTier = void 0;
var OrmSubscriptionTier;
(function (OrmSubscriptionTier) {
    OrmSubscriptionTier["FREE"] = "FREE";
    OrmSubscriptionTier["PRO"] = "PRO";
    OrmSubscriptionTier["AGENCY"] = "AGENCY";
})(OrmSubscriptionTier || (exports.OrmSubscriptionTier = OrmSubscriptionTier = {}));
var OrmTemplateType;
(function (OrmTemplateType) {
    OrmTemplateType["SHOWCASE"] = "SHOWCASE";
    OrmTemplateType["ECOMMERCE_ITEM"] = "ECOMMERCE_ITEM";
    OrmTemplateType["ECOMMERCE_SUBSCRIPTION"] = "ECOMMERCE_SUBSCRIPTION";
})(OrmTemplateType || (exports.OrmTemplateType = OrmTemplateType = {}));
var OrmRunnerTaskStatus;
(function (OrmRunnerTaskStatus) {
    OrmRunnerTaskStatus["QUEUED"] = "QUEUED";
    OrmRunnerTaskStatus["PROCESSING"] = "PROCESSING";
    OrmRunnerTaskStatus["COMPLETED"] = "COMPLETED";
    OrmRunnerTaskStatus["FAILED"] = "FAILED";
})(OrmRunnerTaskStatus || (exports.OrmRunnerTaskStatus = OrmRunnerTaskStatus = {}));
var OrmRunnerTaskType;
(function (OrmRunnerTaskType) {
    OrmRunnerTaskType["WEBSITE_GENERATION"] = "WEBSITE_GENERATION";
    OrmRunnerTaskType["SOCIAL_MEDIA_CONTENT"] = "SOCIAL_MEDIA_CONTENT";
    OrmRunnerTaskType["BLOG_POST_WRITING"] = "BLOG_POST_WRITING";
})(OrmRunnerTaskType || (exports.OrmRunnerTaskType = OrmRunnerTaskType = {}));
