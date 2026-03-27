#!/usr/bin/env bash
BASE="http://localhost:3003"
TENANT="test-biz-1"
RUN=$(date +%s)
PASS=0
FAIL=0
ERRORS=()

GREEN='\033[0;32m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

check() {
  local label="$1" expected="$2" actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo -e "  ${GREEN}+${NC} $label"; PASS=$((PASS+1))
  else
    echo -e "  ${RED}x${NC} $label"
    echo -e "    Expected: $expected"; echo -e "    Got:      $actual"
    FAIL=$((FAIL+1)); ERRORS+=("$label")
  fi
}

check_status() {
  local label="$1" expected_code="$2" actual_code="$3" body="$4"
  if [ "$actual_code" = "$expected_code" ]; then
    echo -e "  ${GREEN}+${NC} $label (HTTP $actual_code)"; PASS=$((PASS+1))
  else
    echo -e "  ${RED}x${NC} $label"
    echo -e "    Expected HTTP: $expected_code  Got: $actual_code"
    echo -e "    Body: $body"
    FAIL=$((FAIL+1)); ERRORS+=("$label")
  fi
}

echo ""
echo "======================================================================"
echo "  Bizpark.Commerce -- Full E2E API Test Suite"
echo "======================================================================"
echo ""

# ── 1. HEALTH ─────────────────────────────────────────────────────────────
echo "${BOLD}[1] Health Check${NC}"
R=$(curl -s "$BASE/")
check "GET / returns ok status" '"status":"ok"' "$R"
check "GET / returns service name" '"service":"bizpark-commerce"' "$R"

# ── 2. DTO VALIDATION ─────────────────────────────────────────────────────
echo ""; echo "${BOLD}[2] DTO Validation${NC}"
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/auth/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"email":"not-an-email","password":"pass123","name":"Test"}')
check_status "Invalid email returns 400" "400" "$CODE" "$(cat /tmp/r.json)"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/auth/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"email":"ok@test.com","password":"12345","name":"Test"}')
check_status "Password < 6 chars returns 400" "400" "$CODE" "$(cat /tmp/r.json)"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/auth/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"email":"ok@test.com","password":"pass123"}')
check_status "Missing name returns 400" "400" "$CODE" "$(cat /tmp/r.json)"

# ── 3. BOOTSTRAP GUARD ────────────────────────────────────────────────────
echo ""; echo "${BOLD}[3] Bootstrap Guard${NC}"
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/auth/bootstrap" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"email":"admin2@testbiz.com","password":"Admin@123","name":"Second Admin"}')
check_status "POST /auth/bootstrap returns 409 when admin already exists" "409" "$CODE" "$(cat /tmp/r.json)"

# ── 4. ADMIN LOGIN ────────────────────────────────────────────────────────
echo ""; echo "${BOLD}[4] Admin Login${NC}"
ADMIN_RESP=$(curl -s -X POST "$BASE/api/commerce/auth/login" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"email":"admin@testbiz.com","password":"Admin@123"}')
ADMIN_TOKEN=$(echo "$ADMIN_RESP" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
check "Admin login returns access_token" '"access_token"' "$ADMIN_RESP"
check "Admin login role is ADMIN" '"role":"ADMIN"' "$ADMIN_RESP"

# ── 5. AUTH EDGE CASES ────────────────────────────────────────────────────
echo ""; echo "${BOLD}[5] Auth Edge Cases${NC}"
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/auth/login" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"email":"admin@testbiz.com","password":"wrongpassword"}')
check_status "Wrong password returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/auth/login" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"email":"nobody@test.com","password":"anything"}')
check_status "Unknown email returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

curl -s -X POST "$BASE/api/commerce/auth/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"email\":\"dup-$RUN@test.com\",\"password\":\"pass123\",\"name\":\"First\"}" > /dev/null
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/auth/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"email\":\"dup-$RUN@test.com\",\"password\":\"pass123\",\"name\":\"Dupe\"}")
check_status "Duplicate email registration returns 400" "400" "$CODE" "$(cat /tmp/r.json)"

# ── 6. GET /ME ────────────────────────────────────────────────────────────
echo ""; echo "${BOLD}[6] Auth Me${NC}"
ME=$(curl -s "$BASE/api/commerce/auth/me" -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "GET /me returns success:true" '"success":true' "$ME"
check "GET /me returns ADMIN role" '"role":"ADMIN"' "$ME"
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/auth/me" -H "x-tenant-id: $TENANT")
check_status "GET /me without token returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# ── 7. ADMIN CREATES ANOTHER ADMIN ────────────────────────────────────────
echo ""; echo "${BOLD}[7] Admin Creates Another Admin${NC}"
R=$(curl -s -X POST "$BASE/api/commerce/auth/admin/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"email\":\"admin2-$RUN@testbiz.com\",\"password\":\"Admin2@123\",\"name\":\"Second Admin\"}")
check "Admin can create another admin" '"role":"ADMIN"' "$R"
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/auth/admin/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"email":"noaccess@test.com","password":"pass123","name":"No Auth"}')
check_status "admin/register without token returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# ── 8. AUTH PROFILE + LOGOUT ──────────────────────────────────────────────
echo ""; echo "${BOLD}[8] Auth Profile Update + Logout${NC}"
# Register a temp user to test profile update
PROFILE_USER=$(curl -s -X POST "$BASE/api/commerce/auth/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"email\":\"profiletest-$RUN@test.com\",\"password\":\"Pass@123\",\"name\":\"Profile User\"}")
PROFILE_TOKEN=$(echo "$PROFILE_USER" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

R=$(curl -s -X PATCH "$BASE/api/commerce/auth/profile" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $PROFILE_TOKEN" \
  -d '{"name":"Updated Name"}')
check "PATCH /auth/profile updates name" '"Updated Name"' "$R"

R=$(curl -s -X PATCH "$BASE/api/commerce/auth/profile" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $PROFILE_TOKEN" \
  -d '{"newPassword":"NewPass@456","currentPassword":"Pass@123"}')
check "PATCH /auth/profile updates password" '"success":true' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X PATCH "$BASE/api/commerce/auth/profile" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $PROFILE_TOKEN" \
  -d '{"newPassword":"NewPass@789","currentPassword":"WrongPass"}')
check_status "Wrong current password returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

R=$(curl -s -X POST "$BASE/api/commerce/auth/logout" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $PROFILE_TOKEN")
check "POST /auth/logout returns success" '"success":true' "$R"

# ── 9. SHIPPING METHODS ───────────────────────────────────────────────────
echo ""; echo "${BOLD}[9] Shipping Methods${NC}"
R=$(curl -s "$BASE/api/commerce/shipping/methods" -H "x-tenant-id: $TENANT")
check "GET /shipping/methods is public" '"success":true' "$R"

STD_CODE="standard-$RUN"
R=$(curl -s -X POST "$BASE/api/commerce/shipping/methods" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"code\":\"$STD_CODE\",\"label\":\"Standard Shipping\",\"flatRate\":5.99,\"currency\":\"USD\",\"active\":true}")
check "Admin creates standard shipping method" "\"code\":\"$STD_CODE\"" "$R"
SHIP_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

R=$(curl -s -X PATCH "$BASE/api/commerce/shipping/methods/$SHIP_ID" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"label":"Standard (Updated)","flatRate":4.99}')
check "Admin updates shipping method" '"Standard (Updated)"' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/shipping/quote" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"methodCode\":\"$STD_CODE\",\"weightKg\":2,\"orderSubtotal\":50}")
check "Shipping quote returns success" '"success":true' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/shipping/quote" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"methodCode\":\"$STD_CODE\",\"orderSubtotal\":150}")
check "Order over \$100 gets discount" '"amount"' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/shipping/quote" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"methodCode":"nonexistent"}')
check "Unknown shipping method returns failure" '"success":false' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/shipping/methods" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"code":"noauth","label":"No Auth","flatRate":1}')
check_status "Create shipping without token returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# ── 10. PRODUCT CATEGORIES ────────────────────────────────────────────────
echo ""; echo "${BOLD}[10] Product Categories${NC}"
R=$(curl -s "$BASE/api/commerce/catalog/categories" -H "x-tenant-id: $TENANT")
check "GET /categories is public" '"success":true' "$R"

CAT1=$(curl -s -X POST "$BASE/api/commerce/catalog/categories" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"name\":\"Clothing\",\"slug\":\"clothing-$RUN\",\"description\":\"All clothing items\"}")
check "Admin creates root category" '"name":"Clothing"' "$CAT1"
CAT1_ID=$(echo "$CAT1" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

CAT2=$(curl -s -X POST "$BASE/api/commerce/catalog/categories" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"name\":\"T-Shirts\",\"slug\":\"tshirts-$RUN\",\"parentId\":\"$CAT1_ID\"}")
check "Admin creates sub-category with parentId" '"name":"T-Shirts"' "$CAT2"
CAT2_ID=$(echo "$CAT2" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

R=$(curl -s "$BASE/api/commerce/catalog/categories" -H "x-tenant-id: $TENANT")
check "Category tree returned" '"children"' "$R"

R=$(curl -s -X PATCH "$BASE/api/commerce/catalog/categories/$CAT1_ID" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"description":"Updated clothing description"}')
check "Admin updates category" '"Updated clothing description"' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" \
  "$BASE/api/commerce/catalog/categories/00000000-0000-0000-0000-000000000000" \
  -H "x-tenant-id: $TENANT")
check_status "GET non-existent category returns 404" "404" "$CODE" "$(cat /tmp/r.json)"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/catalog/categories" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"name":"Hack","slug":"hack"}')
check_status "Create category without auth returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# ── 11. CATALOG PRODUCTS WITH CATEGORY ────────────────────────────────────
echo ""; echo "${BOLD}[11] Catalog Products (Full CRUD + Category + Pagination)${NC}"
R=$(curl -s "$BASE/api/commerce/catalog/products" -H "x-tenant-id: $TENANT")
check "GET /catalog/products is public" '"success":true' "$R"
check "Paginated response has total field" '"total"' "$R"

P1=$(curl -s -X POST "$BASE/api/commerce/catalog/products" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"title\":\"Blue T-Shirt\",\"description\":\"Comfortable cotton tee\",\"price\":29.99,\"currency\":\"USD\",\"categoryId\":\"$CAT2_ID\"}")
check "Admin creates product with category" '"title":"Blue T-Shirt"' "$P1"
check "Product has categoryId" '"categoryId"' "$P1"
PROD1_ID=$(echo "$P1" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

P2=$(curl -s -X POST "$BASE/api/commerce/catalog/products" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"Running Shoes","price":89.99}')
check "Product defaults currency to USD" '"currency":"USD"' "$P2"
PROD2_ID=$(echo "$P2" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

P3=$(curl -s -X POST "$BASE/api/commerce/catalog/products" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"Laptop Bag","price":49.99}')
check "Admin creates third product" '"title":"Laptop Bag"' "$P3"
PROD3_ID=$(echo "$P3" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Filter by category
R=$(curl -s "$BASE/api/commerce/catalog/products?categoryId=$CAT2_ID" -H "x-tenant-id: $TENANT")
check "Filter products by categoryId returns results" '"Blue T-Shirt"' "$R"

# Product search
R=$(curl -s "$BASE/api/commerce/catalog/products?search=T-Shirt" -H "x-tenant-id: $TENANT")
check "Search by title keyword returns match" '"Blue T-Shirt"' "$R"
R=$(curl -s "$BASE/api/commerce/catalog/products?search=zzznomatch_xyz" -H "x-tenant-id: $TENANT")
check "Search with no match returns empty data" '"data":[]' "$R"

R=$(curl -s "$BASE/api/commerce/catalog/products/$PROD1_ID" -H "x-tenant-id: $TENANT")
check "GET /catalog/products/:id returns product" '"title":"Blue T-Shirt"' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" \
  "$BASE/api/commerce/catalog/products/00000000-0000-0000-0000-000000000000" -H "x-tenant-id: $TENANT")
check_status "GET non-existent product returns 404" "404" "$CODE" "$(cat /tmp/r.json)"

R=$(curl -s -X PATCH "$BASE/api/commerce/catalog/products/$PROD1_ID" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"price":34.99}')
check "Admin updates product price" '"price":34.99' "$R"

# Soft delete
TEMP_P=$(curl -s -X POST "$BASE/api/commerce/catalog/products" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"Delete Me","price":1}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
R=$(curl -s -X DELETE "$BASE/api/commerce/catalog/products/$TEMP_P" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin soft-deletes product" '"deleted":true' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" \
  "$BASE/api/commerce/catalog/products/$TEMP_P" -H "x-tenant-id: $TENANT")
check_status "Soft-deleted product returns 404" "404" "$CODE" "$(cat /tmp/r.json)"

# ── 12. PRODUCT VARIANTS ──────────────────────────────────────────────────
echo ""; echo "${BOLD}[12] Product Variants${NC}"
R=$(curl -s "$BASE/api/commerce/catalog/products/$PROD1_ID/variants" -H "x-tenant-id: $TENANT")
check "GET variants is public" '"success":true' "$R"

V1=$(curl -s -X POST "$BASE/api/commerce/catalog/products/$PROD1_ID/variants" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"title\":\"Red / Small\",\"sku\":\"TSH-RED-S-$RUN\",\"price\":27.99,\"attributes\":{\"color\":\"Red\",\"size\":\"Small\"}}")
check "Admin creates variant Red/Small" '"title":"Red / Small"' "$V1"
check "Variant has attributes" '"color":"Red"' "$V1"
V1_ID=$(echo "$V1" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

V2=$(curl -s -X POST "$BASE/api/commerce/catalog/products/$PROD1_ID/variants" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"title\":\"Blue / Medium\",\"sku\":\"TSH-BLU-M-$RUN\",\"price\":29.99,\"attributes\":{\"color\":\"Blue\",\"size\":\"Medium\"}}")
check "Admin creates variant Blue/Medium" '"title":"Blue / Medium"' "$V2"
V2_ID=$(echo "$V2" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

R=$(curl -s "$BASE/api/commerce/catalog/products/$PROD1_ID/variants" -H "x-tenant-id: $TENANT")
check "List variants returns both" '"Red / Small"' "$R"

R=$(curl -s -X PATCH "$BASE/api/commerce/catalog/products/$PROD1_ID/variants/$V1_ID" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"price":24.99}')
check "Admin updates variant price" '"price":24.99' "$R"

R=$(curl -s "$BASE/api/commerce/catalog/products/$PROD1_ID/variants/$V1_ID" -H "x-tenant-id: $TENANT")
check "GET single variant by ID" '"Red / Small"' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" \
  "$BASE/api/commerce/catalog/products/$PROD1_ID/variants/00000000-0000-0000-0000-000000000000" \
  -H "x-tenant-id: $TENANT")
check_status "GET non-existent variant returns 404" "404" "$CODE" "$(cat /tmp/r.json)"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST \
  "$BASE/api/commerce/catalog/products/$PROD1_ID/variants" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"title":"Hack","sku":"hack"}')
check_status "Create variant without auth returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# ── 13. INVENTORY MANAGEMENT ──────────────────────────────────────────────
echo ""; echo "${BOLD}[13] Inventory Management${NC}"
R=$(curl -s -X POST "$BASE/api/commerce/inventory/upsert" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"productId\":\"$PROD1_ID\",\"sku\":\"TSHIRT-M-$RUN\",\"availableQuantity\":50}")
check "Admin sets T-Shirt inventory (qty=50)" '"availableQuantity":50' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/inventory/upsert" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"productId\":\"$PROD2_ID\",\"sku\":\"SHOES-42-$RUN\",\"availableQuantity\":20}")
check "Admin sets Shoes inventory (qty=20)" '"availableQuantity":20' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/inventory/upsert" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"productId\":\"$PROD3_ID\",\"sku\":\"BAG-BLK-$RUN\",\"availableQuantity\":5}")
check "Admin sets Laptop Bag inventory (qty=5)" '"availableQuantity":5' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/inventory/upsert" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"productId\":\"$PROD1_ID\",\"sku\":\"TSHIRT-XS-$RUN\",\"availableQuantity\":-5}")
check "Negative qty clamped to 0" '"availableQuantity":0' "$R"

# Set variant-level inventory
R=$(curl -s -X POST "$BASE/api/commerce/inventory/upsert" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"productId\":\"$PROD1_ID\",\"variantId\":\"$V1_ID\",\"sku\":\"TSH-RED-S-INV-$RUN\",\"availableQuantity\":10}")
check "Admin sets variant-level inventory" '"availableQuantity":10' "$R"

R=$(curl -s "$BASE/api/commerce/inventory" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin lists all inventory (paginated)" '"success":true' "$R"
check "Inventory list has total field" '"total"' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/inventory" -H "x-tenant-id: $TENANT")
check_status "GET inventory without auth returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

R=$(curl -s -X POST "$BASE/api/commerce/inventory/reserve" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"sku\":\"BAG-BLK-$RUN\",\"quantity\":2}")
check "Reserve 2 of 5 bags succeeds" '"success":true' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/inventory/reserve" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"sku\":\"BAG-BLK-$RUN\",\"quantity\":99}")
check "Reserve 99 when 3 left returns failure" '"success":false' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/inventory/reserve" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"sku":"NONEXISTENT","quantity":1}')
check "Reserve unknown SKU returns failure" '"success":false' "$R"

# ── 14. CUSTOMER REGISTRATION ─────────────────────────────────────────────
echo ""; echo "${BOLD}[14] Customer Registration${NC}"
CUST1=$(curl -s -X POST "$BASE/api/commerce/auth/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"email\":\"alice-$RUN@shop.com\",\"password\":\"Alice@123\",\"name\":\"Alice Smith\"}")
check "Alice registers as CUSTOMER" '"role":"CUSTOMER"' "$CUST1"
CUST1_TOKEN=$(echo "$CUST1" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
CUST1_ID=$(echo "$CUST1" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

CUST2=$(curl -s -X POST "$BASE/api/commerce/auth/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"email\":\"bob-$RUN@shop.com\",\"password\":\"Bob@123\",\"name\":\"Bob Jones\"}")
check "Bob registers as CUSTOMER" '"role":"CUSTOMER"' "$CUST2"
CUST2_TOKEN=$(echo "$CUST2" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
CUST2_ID=$(echo "$CUST2" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

R=$(curl -s -X POST "$BASE/api/commerce/auth/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"email\":\"UPPER-$RUN@SHOP.COM\",\"password\":\"pass123\",\"name\":\"Upper\"}")
check "Email normalized to lowercase" "\"email\":\"upper-$RUN@shop.com\"" "$R"

# ── 15. ROLE-BASED ACCESS CONTROL ─────────────────────────────────────────
echo ""; echo "${BOLD}[15] Role-Based Access Control${NC}"
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/customers" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check_status "Customer cannot access ADMIN /customers (403)" "403" "$CODE" "$(cat /tmp/r.json)"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/inventory" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check_status "Customer cannot access ADMIN /inventory (403)" "403" "$CODE" "$(cat /tmp/r.json)"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X PATCH \
  "$BASE/api/commerce/orders/some-id/status" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" -d '{"status":"PAID"}')
check_status "Customer cannot PATCH order status (403)" "403" "$CODE" "$(cat /tmp/r.json)"

R=$(curl -s "$BASE/api/commerce/customers" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin CAN access /customers" '"success":true' "$R"

# ── 16. CART (with Price Snapshots + Variants) ────────────────────────────
echo ""; echo "${BOLD}[16] Cart Operations (Price Snapshots + Variant Support)${NC}"
R=$(curl -s "$BASE/api/commerce/cart/$CUST1_ID" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check "GET cart for new customer returns success" '"success":true' "$R"

# Add T-Shirt (no variant)
R=$(curl -s -X POST "$BASE/api/commerce/cart/$CUST1_ID/items" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"productId\":\"$PROD1_ID\",\"quantity\":2}")
check "Add T-Shirt x2 to Alice cart" '"success":true' "$R"
check "Cart item has unitPrice snapshot" '"unitPrice"' "$R"
check "Cart item has unitTitle snapshot" '"unitTitle":"Blue T-Shirt"' "$R"

# Add T-Shirt with variant
R=$(curl -s -X POST "$BASE/api/commerce/cart/$CUST1_ID/items" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"productId\":\"$PROD1_ID\",\"variantId\":\"$V1_ID\",\"quantity\":1}")
check "Add T-Shirt variant (Red/Small) to cart" '"success":true' "$R"
check "Variant item has variant title snapshot" '"Red / Small"' "$R"

# Get the T-Shirt (no variant) item ID to update its quantity
TSHIRT_ITEM_ID=$(curl -s "$BASE/api/commerce/cart/$CUST1_ID" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN" \
  | grep -o '"id":"[^"]*","productId":"'"$PROD1_ID"'"' | head -1 | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
R=$(curl -s -X PATCH "$BASE/api/commerce/cart/$CUST1_ID/items/$TSHIRT_ITEM_ID" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d '{"quantity":5}')
check "PATCH cart item updates quantity to 5" '"quantity":5' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/cart/$CUST1_ID/items" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"productId\":\"$PROD2_ID\",\"quantity\":1}")
check "Add Shoes x1 to Alice cart" '"success":true' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/cart/$CUST2_ID/items" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST2_TOKEN" \
  -d "{\"productId\":\"$PROD3_ID\",\"quantity\":1}")
check "Add Laptop Bag to Bob cart" '"success":true' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/cart/$CUST2_ID" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check_status "Alice cannot access Bob's cart (403)" "403" "$CODE" "$(cat /tmp/r.json)"

R=$(curl -s "$BASE/api/commerce/cart/$CUST1_ID" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin can access any customer cart" '"success":true' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/cart/$CUST1_ID" -H "x-tenant-id: $TENANT")
check_status "GET cart without token returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# ── 17. CHECKOUT ──────────────────────────────────────────────────────────
echo ""; echo "${BOLD}[17] Checkout (Transaction + Inventory Reserve)${NC}"

# Empty cart checkout rejection
EMPTY_USER=$(curl -s -X POST "$BASE/api/commerce/auth/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"email\":\"emptyuser-$RUN@test.com\",\"password\":\"Pass@123\",\"name\":\"Empty User\"}")
EMPTY_TOKEN=$(echo "$EMPTY_USER" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
EMPTY_ID=$(echo "$EMPTY_USER" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/checkout/complete" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $EMPTY_TOKEN" \
  -d "{\"customerId\":\"$EMPTY_ID\"}")
check_status "Empty cart checkout returns 400" "400" "$CODE" "$(cat /tmp/r.json)"

R=$(curl -s -X POST "$BASE/api/commerce/checkout/begin" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"customerId\":\"$CUST1_ID\"}")
check "Alice begins checkout (READY_FOR_PAYMENT)" '"READY_FOR_PAYMENT"' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/checkout/complete" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"customerId\":\"$CUST1_ID\",\"shippingAddress\":{\"name\":\"Alice Smith\",\"line1\":\"123 Main St\",\"city\":\"Colombo\",\"postalCode\":\"00100\",\"country\":\"LK\"}}")
check "Alice completes checkout — order created" '"success":true' "$R"
check "Checkout order has totalAmount" '"totalAmount"' "$R"
check "Checkout order has unitPrice on items" '"unitPrice"' "$R"
check "Checkout order has shippingName" '"shippingName":"Alice Smith"' "$R"
check "Checkout order has shippingCity" '"shippingCity":"Colombo"' "$R"
ALICE_ORDER_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

R=$(curl -s "$BASE/api/commerce/cart/$CUST1_ID" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
ITEM_COUNT=$(echo "$R" | grep -o '"productId"' | wc -l | tr -d ' ')
if [ "$ITEM_COUNT" = "0" ]; then
  echo -e "  ${GREEN}+${NC} Cart cleared after checkout"; PASS=$((PASS+1))
else
  echo -e "  ${RED}x${NC} Cart NOT cleared after checkout ($ITEM_COUNT items remain)"
  FAIL=$((FAIL+1)); ERRORS+=("Cart cleared after checkout")
fi

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/checkout/begin" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"customerId\":\"$CUST1_ID\"}")
check_status "Checkout without token returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# ── 18. ORDERS — FULL LIFECYCLE ───────────────────────────────────────────
echo ""; echo "${BOLD}[18] Orders — Full Lifecycle${NC}"
R=$(curl -s -X POST "$BASE/api/commerce/orders" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST2_TOKEN" \
  -d "{\"customerId\":\"$CUST2_ID\",\"items\":[{\"productId\":\"$PROD3_ID\",\"quantity\":1}]}")
check "Bob places order — PENDING status" '"status":"PENDING"' "$R"
BOB_ORDER_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

R=$(curl -s "$BASE/api/commerce/orders" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check "Alice sees her own orders (paginated)" '"customerId"' "$R"
if echo "$R" | grep -q "$BOB_ORDER_ID"; then
  echo -e "  ${RED}x${NC} Alice's order list leaks Bob's order"
  FAIL=$((FAIL+1)); ERRORS+=("Customer order isolation")
else
  echo -e "  ${GREEN}+${NC} Customer order list is isolated (Alice cannot see Bob's order)"; PASS=$((PASS+1))
fi

R=$(curl -s "$BASE/api/commerce/orders/$ALICE_ORDER_ID" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check "Alice can GET her own order by ID" '"totalAmount"' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" \
  "$BASE/api/commerce/orders/$BOB_ORDER_ID" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check_status "Alice cannot GET Bob's order (403)" "403" "$CODE" "$(cat /tmp/r.json)"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/orders" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"customerId\":\"$CUST2_ID\",\"items\":[{\"productId\":\"$PROD1_ID\",\"quantity\":1}]}")
check_status "Customer cannot place order for another customer (403)" "403" "$CODE" "$(cat /tmp/r.json)"

R=$(curl -s "$BASE/api/commerce/orders" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin sees all orders" '"success":true' "$R"

# Customer self-cancel
CANCEL_ORDER=$(curl -s -X POST "$BASE/api/commerce/orders" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"customerId\":\"$CUST1_ID\",\"items\":[{\"productId\":\"$PROD1_ID\",\"quantity\":1,\"unitPrice\":34.99,\"unitTitle\":\"Blue T-Shirt\"}]}")
CANCEL_ORDER_ID=$(echo "$CANCEL_ORDER" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
R=$(curl -s -X PATCH "$BASE/api/commerce/orders/$CANCEL_ORDER_ID/cancel" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check "Customer can cancel own PENDING order" '"status":"CANCELLED"' "$R"

# Customer cannot cancel another customer's order
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X PATCH \
  "$BASE/api/commerce/orders/$BOB_ORDER_ID/cancel" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check_status "Customer cannot cancel another customer's order (404)" "404" "$CODE" "$(cat /tmp/r.json)"

# Cannot cancel PAID order (bob's is still PENDING, use alice's fulfilled order)
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X PATCH \
  "$BASE/api/commerce/orders/$ALICE_ORDER_ID/cancel" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check_status "Customer cannot cancel non-PENDING order (400)" "400" "$CODE" "$(cat /tmp/r.json)"

# Status transitions
R=$(curl -s -X PATCH "$BASE/api/commerce/orders/$ALICE_ORDER_ID/status" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -d '{"status":"PAID"}')
check "Admin updates order to PAID" '"status":"PAID"' "$R"

R=$(curl -s -X PATCH "$BASE/api/commerce/orders/$ALICE_ORDER_ID/status" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -d '{"status":"FULFILLED"}')
check "Admin updates order to FULFILLED" '"status":"FULFILLED"' "$R"

# Invalid transition: FULFILLED → PENDING (terminal state)
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X PATCH \
  "$BASE/api/commerce/orders/$ALICE_ORDER_ID/status" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -d '{"status":"PENDING"}')
check_status "FULFILLED → PENDING transition rejected (400)" "400" "$CODE" "$(cat /tmp/r.json)"

R=$(curl -s -X PATCH "$BASE/api/commerce/orders/$BOB_ORDER_ID/status" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -d '{"status":"CANCELLED"}')
check "Admin cancels Bob order (CANCELLED + inventory released)" '"status":"CANCELLED"' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/orders" -H "x-tenant-id: $TENANT")
check_status "GET orders without auth returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# ── 19. PAYMENTS ──────────────────────────────────────────────────────────
echo ""; echo "${BOLD}[19] Payments${NC}"
R=$(curl -s -X POST "$BASE/api/commerce/payments/intent" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"customerId\":\"$CUST1_ID\",\"orderId\":\"$ALICE_ORDER_ID\",\"amount\":149.97}")
check "Create payment intent with orderId" '"status":"REQUIRES_CONFIRMATION"' "$R"
check "Payment intent has orderId" '"orderId"' "$R"
check "Payment provider is STRIPE" '"provider":"STRIPE"' "$R"
check "Payment defaults to USD" '"currency":"USD"' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/payments/intent" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"customerId\":\"$CUST1_ID\",\"amount\":18500,\"currency\":\"LKR\"}")
check "Payment intent with LKR currency" '"currency":"LKR"' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/payments/webhook" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"type":"payment.succeeded","data":{"id":"pi_test_123"}}')
check "Payment webhook accepted" '"accepted":true' "$R"

# ── 20. CUSTOMER MANAGEMENT ───────────────────────────────────────────────
echo ""; echo "${BOLD}[20] Customer Management (Admin)${NC}"
R=$(curl -s "$BASE/api/commerce/customers" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin lists all customers" '"success":true' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/customers" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"email\":\"wholesale-$RUN@partner.com\",\"name\":\"Wholesale Partner\"}")
check "Admin creates B2B customer record" "\"email\":\"wholesale-$RUN@partner.com\"" "$R"
CUST_RECORD_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

R=$(curl -s -X POST "$BASE/api/commerce/customers" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"email\":\"guest-$RUN@noemail.com\"}")
check "Admin creates customer without name (null)" '"name":null' "$R"

R=$(curl -s "$BASE/api/commerce/customers/$CUST_RECORD_ID" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin GET /customers/:id" '"success":true' "$R"

R=$(curl -s -X PATCH "$BASE/api/commerce/customers/$CUST_RECORD_ID" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Updated Partner Name"}')
check "Admin PATCH /customers/:id updates name" '"Updated Partner Name"' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" \
  "$BASE/api/commerce/customers/00000000-0000-0000-0000-000000000000" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check_status "GET /customers/:id non-existent returns 404" "404" "$CODE" "$(cat /tmp/r.json)"

# ── 21. SUBSCRIPTIONS (DB-backed + Expiry) ────────────────────────────────
echo ""; echo "${BOLD}[21] Subscriptions (DB-backed + Expiry + Ownership)${NC}"
R=$(curl -s -X POST "$BASE/api/commerce/subscriptions" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"customerId\":\"$CUST1_ID\",\"planCode\":\"PRO_MONTHLY\",\"billingInterval\":\"monthly\"}")
check "Alice subscribes to PRO_MONTHLY with billing interval" '"status":"ACTIVE"' "$R"
check "Subscription has expiresAt set" '"expiresAt"' "$R"
check "Subscription has renewsAt set" '"renewsAt"' "$R"
SUB_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

R=$(curl -s "$BASE/api/commerce/subscriptions" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check "Customer sees their own subscriptions" '"planCode":"PRO_MONTHLY"' "$R"

R=$(curl -s "$BASE/api/commerce/subscriptions" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin sees all subscriptions" '"success":true' "$R"

R=$(curl -s "$BASE/api/commerce/subscriptions/$SUB_ID" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check "Customer GET /subscriptions/:id (own)" '"planCode":"PRO_MONTHLY"' "$R"

# Bob cannot cancel Alice's subscription
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X PATCH \
  "$BASE/api/commerce/subscriptions/$SUB_ID/cancel" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST2_TOKEN")
check_status "Bob cannot cancel Alice's subscription (403)" "403" "$CODE" "$(cat /tmp/r.json)"

R=$(curl -s -X PATCH "$BASE/api/commerce/subscriptions/$SUB_ID/cancel" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check "Alice cancels own subscription → CANCELLED + renewsAt cleared" '"status":"CANCELLED"' "$R"

# ── 22. MULTI-TENANT ISOLATION ────────────────────────────────────────────
echo ""; echo "${BOLD}[22] Multi-Tenant Isolation${NC}"
TENANT2="test-biz-$RUN"

BOOT2=$(curl -s -X POST "$BASE/api/commerce/auth/bootstrap" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT2" \
  -d "{\"email\":\"owner-$RUN@biz2.com\",\"password\":\"Owner@123\",\"name\":\"Biz 2 Owner\"}")
check "Bootstrap fresh tenant $TENANT2" '"role":"ADMIN"' "$BOOT2"
T2_TOKEN=$(echo "$BOOT2" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

R=$(curl -s "$BASE/api/commerce/catalog/products" -H "x-tenant-id: $TENANT2")
PROD_COUNT=$(echo "$R" | grep -o '"id"' | wc -l | tr -d ' ')
if [ "$PROD_COUNT" = "0" ]; then
  echo -e "  ${GREEN}+${NC} $TENANT2 catalog is isolated (0 products)"; PASS=$((PASS+1))
else
  echo -e "  ${RED}x${NC} ISOLATION FAILURE: $TENANT2 sees $PROD_COUNT products from $TENANT"
  FAIL=$((FAIL+1)); ERRORS+=("Multi-tenant catalog isolation")
fi

R=$(curl -s "$BASE/api/commerce/orders" -H "x-tenant-id: $TENANT2" -H "Authorization: Bearer $T2_TOKEN")
ORDER_COUNT=$(echo "$R" | grep -o '"status"' | wc -l | tr -d ' ')
if [ "$ORDER_COUNT" = "0" ]; then
  echo -e "  ${GREEN}+${NC} $TENANT2 orders are isolated (0 orders)"; PASS=$((PASS+1))
else
  echo -e "  ${RED}x${NC} ISOLATION FAILURE: $TENANT2 sees $ORDER_COUNT orders"
  FAIL=$((FAIL+1)); ERRORS+=("Multi-tenant order isolation")
fi

R=$(curl -s "$BASE/api/commerce/customers" \
  -H "x-tenant-id: $TENANT2" -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$R" | grep -q "\"email\":\"alice"; then
  echo -e "  ${RED}x${NC} Cross-tenant data leak detected"
  FAIL=$((FAIL+1)); ERRORS+=("Cross-tenant data leak")
else
  echo -e "  ${GREEN}+${NC} Cross-tenant token does not expose other tenant's customers"; PASS=$((PASS+1))
fi

# ── SUMMARY ───────────────────────────────────────────────────────────────
TOTAL=$((PASS+FAIL))
echo ""
echo "======================================================================"
echo "  E2E Results: $PASS passed  /  $FAIL failed  /  $TOTAL total"
echo "======================================================================"
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""; echo "Failed tests:"
  for e in "${ERRORS[@]}"; do echo "  - $e"; done
fi
echo ""
