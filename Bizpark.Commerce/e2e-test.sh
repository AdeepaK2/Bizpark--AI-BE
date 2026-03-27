#!/usr/bin/env bash
BASE="http://localhost:3003"
TENANT="test-biz-1"
RUN=$(date +%s)   # unique suffix per run — avoids DB unique constraint clashes
PASS=0
FAIL=0
ERRORS=()

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

check() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo -e "  ${GREEN}+${NC} $label"
    PASS=$((PASS+1))
  else
    echo -e "  ${RED}x${NC} $label"
    echo -e "    Expected: $expected"
    echo -e "    Got:      $actual"
    FAIL=$((FAIL+1))
    ERRORS+=("$label")
  fi
}

check_status() {
  local label="$1"
  local expected_code="$2"
  local actual_code="$3"
  local body="$4"
  if [ "$actual_code" = "$expected_code" ]; then
    echo -e "  ${GREEN}+${NC} $label (HTTP $actual_code)"
    PASS=$((PASS+1))
  else
    echo -e "  ${RED}x${NC} $label"
    echo -e "    Expected HTTP: $expected_code  Got: $actual_code"
    echo -e "    Body: $body"
    FAIL=$((FAIL+1))
    ERRORS+=("$label")
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
echo ""
echo "${BOLD}[2] DTO Validation (Global ValidationPipe)${NC}"

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
echo ""
echo "${BOLD}[3] Bootstrap Guard${NC}"
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/auth/bootstrap" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"email":"admin2@testbiz.com","password":"Admin@123","name":"Second Admin"}')
check_status "POST /auth/bootstrap returns 409 when admin already exists" "409" "$CODE" "$(cat /tmp/r.json)"

# ── 4. ADMIN LOGIN ────────────────────────────────────────────────────────
echo ""
echo "${BOLD}[4] Admin Login${NC}"
ADMIN_RESP=$(curl -s -X POST "$BASE/api/commerce/auth/login" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"email":"admin@testbiz.com","password":"Admin@123"}')
ADMIN_TOKEN=$(echo "$ADMIN_RESP" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
check "Admin login returns access_token" '"access_token"' "$ADMIN_RESP"
check "Admin login role is ADMIN" '"role":"ADMIN"' "$ADMIN_RESP"

# ── 5. AUTH EDGE CASES ────────────────────────────────────────────────────
echo ""
echo "${BOLD}[5] Auth Edge Cases${NC}"

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
echo ""
echo "${BOLD}[6] Auth Me${NC}"
ME=$(curl -s "$BASE/api/commerce/auth/me" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "GET /me returns success:true" '"success":true' "$ME"
check "GET /me returns ADMIN role" '"role":"ADMIN"' "$ME"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/auth/me" -H "x-tenant-id: $TENANT")
check_status "GET /me without token returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# ── 7. ADMIN CREATES ANOTHER ADMIN ────────────────────────────────────────
echo ""
echo "${BOLD}[7] Admin Creates Another Admin${NC}"
R=$(curl -s -X POST "$BASE/api/commerce/auth/admin/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"email\":\"admin2-$RUN@testbiz.com\",\"password\":\"Admin2@123\",\"name\":\"Second Admin\"}")
check "Admin can create another admin" '"role":"ADMIN"' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/auth/admin/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"email":"noaccess@test.com","password":"pass123","name":"No Auth"}')
check_status "admin/register without token returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# ── 8. SHIPPING ───────────────────────────────────────────────────────────
echo ""
echo "${BOLD}[8] Shipping Methods${NC}"
R=$(curl -s "$BASE/api/commerce/shipping/methods" -H "x-tenant-id: $TENANT")
check "GET /shipping/methods is public" '"success":true' "$R"

STD_CODE="standard-$RUN"
R=$(curl -s -X POST "$BASE/api/commerce/shipping/methods" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"code\":\"$STD_CODE\",\"label\":\"Standard Shipping\",\"flatRate\":5.99,\"currency\":\"USD\",\"active\":true}")
check "Admin creates standard shipping method" "\"code\":\"$STD_CODE\"" "$R"

R=$(curl -s -X POST "$BASE/api/commerce/shipping/quote" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"methodCode\":\"$STD_CODE\",\"weightKg\":2,\"orderSubtotal\":50}")
check "Shipping quote returns success" '"success":true' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/shipping/quote" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"methodCode\":\"$STD_CODE\",\"orderSubtotal\":150}")
check "Order over $100 gets free shipping (amount=0)" '"amount":0' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/shipping/quote" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"methodCode":"nonexistent"}')
check "Unknown shipping method returns failure" '"success":false' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/shipping/methods" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"code":"noauth","label":"No Auth","flatRate":1}')
check_status "Create shipping without token returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# ── 9. CATALOG CRUD ───────────────────────────────────────────────────────
echo ""
echo "${BOLD}[9] Catalog Products (Full CRUD)${NC}"

R=$(curl -s "$BASE/api/commerce/catalog/products" -H "x-tenant-id: $TENANT")
check "GET /catalog/products is public" '"success":true' "$R"

P1=$(curl -s -X POST "$BASE/api/commerce/catalog/products" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"Blue T-Shirt","description":"Comfortable cotton tee","price":29.99,"currency":"USD"}')
check "Admin creates product" '"title":"Blue T-Shirt"' "$P1"
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

# GET by ID
R=$(curl -s "$BASE/api/commerce/catalog/products/$PROD1_ID" -H "x-tenant-id: $TENANT")
check "GET /catalog/products/:id returns product" '"title":"Blue T-Shirt"' "$R"

# GET 404
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" \
  "$BASE/api/commerce/catalog/products/00000000-0000-0000-0000-000000000000" -H "x-tenant-id: $TENANT")
check_status "GET /catalog/products/:id non-existent returns 404" "404" "$CODE" "$(cat /tmp/r.json)"

# PATCH update
R=$(curl -s -X PATCH "$BASE/api/commerce/catalog/products/$PROD1_ID" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"price":34.99,"description":"Updated description"}')
check "Admin updates product price" '"price":34.99' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X PATCH \
  "$BASE/api/commerce/catalog/products/$PROD1_ID" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"price":1}')
check_status "PATCH product without auth returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# DELETE
TEMP_P=$(curl -s -X POST "$BASE/api/commerce/catalog/products" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"Delete Me","price":1}' | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
R=$(curl -s -X DELETE "$BASE/api/commerce/catalog/products/$TEMP_P" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin deletes product" '"deleted":true' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" \
  "$BASE/api/commerce/catalog/products/$TEMP_P" -H "x-tenant-id: $TENANT")
check_status "Deleted product GET returns 404" "404" "$CODE" "$(cat /tmp/r.json)"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/catalog/products" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"title":"Hacker Product","price":1}')
check_status "Create product without auth returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# ── 10. INVENTORY ─────────────────────────────────────────────────────────
echo ""
echo "${BOLD}[10] Inventory Management${NC}"

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
  -d "{\"productId\":\"$PROD3_ID\",\"sku\":\"BAG-BLK-$RUN\",\"availableQuantity\":3}")
check "Admin sets Laptop Bag inventory (qty=3)" '"availableQuantity":3' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/inventory/upsert" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"productId\":\"$PROD1_ID\",\"sku\":\"TSHIRT-XS-$RUN\",\"availableQuantity\":-5}")
check "Negative qty clamped to 0" '"availableQuantity":0' "$R"

R=$(curl -s "$BASE/api/commerce/inventory" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin lists all inventory" '"success":true' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/inventory" -H "x-tenant-id: $TENANT")
check_status "GET inventory without auth returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

R=$(curl -s -X POST "$BASE/api/commerce/inventory/reserve" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"sku\":\"BAG-BLK-$RUN\",\"quantity\":2}")
check "Reserve 2 of 3 bags succeeds" '"success":true' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/inventory/reserve" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"sku\":\"BAG-BLK-$RUN\",\"quantity\":99}")
check "Reserve 99 when 1 left returns failure" '"success":false' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/inventory/reserve" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"sku":"NONEXISTENT","quantity":1}')
check "Reserve unknown SKU returns failure" '"success":false' "$R"

# ── 11. CUSTOMER REGISTRATION ─────────────────────────────────────────────
echo ""
echo "${BOLD}[11] Customer Registration${NC}"

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

# ── 12. ROLE-BASED ACCESS CONTROL ─────────────────────────────────────────
echo ""
echo "${BOLD}[12] Role-Based Access Control${NC}"

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

# ── 13. CART WITH PRICE SNAPSHOTS ─────────────────────────────────────────
echo ""
echo "${BOLD}[13] Cart Operations (with Price Snapshots)${NC}"

R=$(curl -s "$BASE/api/commerce/cart/$CUST1_ID" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check "GET cart for new customer returns success" '"success":true' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/cart/$CUST1_ID/items" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"productId\":\"$PROD1_ID\",\"quantity\":2}")
check "Add T-Shirt x2 to Alice cart" '"success":true' "$R"
check "Cart item has unitPrice snapshot" '"unitPrice"' "$R"
check "Cart item has unitTitle snapshot" '"unitTitle":"Blue T-Shirt"' "$R"

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

# Cart ownership: Alice cannot access Bob's cart
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/cart/$CUST2_ID" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check_status "Alice cannot access Bob's cart (403)" "403" "$CODE" "$(cat /tmp/r.json)"

# Admin CAN access any cart
R=$(curl -s "$BASE/api/commerce/cart/$CUST1_ID" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin can access any customer cart" '"success":true' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/cart/$CUST1_ID" \
  -H "x-tenant-id: $TENANT")
check_status "GET cart without token returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# ── 14. CHECKOUT ──────────────────────────────────────────────────────────
echo ""
echo "${BOLD}[14] Checkout${NC}"

R=$(curl -s -X POST "$BASE/api/commerce/checkout/begin" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"customerId\":\"$CUST1_ID\"}")
check "Alice begins checkout (READY_FOR_PAYMENT)" '"READY_FOR_PAYMENT"' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/checkout/complete" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"customerId\":\"$CUST1_ID\"}")
check "Alice completes checkout — order created" '"success":true' "$R"
check "Checkout order has totalAmount" '"totalAmount"' "$R"
check "Checkout order has unitPrice on items" '"unitPrice"' "$R"
ALICE_ORDER_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Cart should be empty after checkout
R=$(curl -s "$BASE/api/commerce/cart/$CUST1_ID" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
ITEM_COUNT=$(echo "$R" | grep -o '"productId"' | wc -l | tr -d ' ')
if [ "$ITEM_COUNT" = "0" ]; then
  echo -e "  ${GREEN}+${NC} Cart cleared after checkout"
  PASS=$((PASS+1))
else
  echo -e "  ${RED}x${NC} Cart NOT cleared after checkout ($ITEM_COUNT items remain)"
  FAIL=$((FAIL+1))
  ERRORS+=("Cart cleared after checkout")
fi

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/checkout/begin" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"customerId\":\"$CUST1_ID\"}")
check_status "Checkout without token returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# ── 15. ORDERS — FULL LIFECYCLE ───────────────────────────────────────────
echo ""
echo "${BOLD}[15] Orders — Full Lifecycle${NC}"

# Bob places an order directly
R=$(curl -s -X POST "$BASE/api/commerce/orders" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST2_TOKEN" \
  -d "{\"customerId\":\"$CUST2_ID\",\"items\":[{\"productId\":\"$PROD3_ID\",\"quantity\":1}]}")
check "Bob places order — PENDING status" '"status":"PENDING"' "$R"
BOB_ORDER_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Customer views their own orders (role-aware GET)
R=$(curl -s "$BASE/api/commerce/orders" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check "Alice sees her own orders" '"customerId"' "$R"
# Alice's orders should not contain Bob's order
if echo "$R" | grep -q "$BOB_ORDER_ID"; then
  echo -e "  ${RED}x${NC} Alice's order list leaks Bob's order"
  FAIL=$((FAIL+1))
  ERRORS+=("Customer order isolation")
else
  echo -e "  ${GREEN}+${NC} Customer order list is isolated (Alice cannot see Bob's order)"
  PASS=$((PASS+1))
fi

# Customer gets single order
R=$(curl -s "$BASE/api/commerce/orders/$ALICE_ORDER_ID" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check "Alice can GET her own order by ID" '"totalAmount"' "$R"

# Customer cannot get another customer's order
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" \
  "$BASE/api/commerce/orders/$BOB_ORDER_ID" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check_status "Alice cannot GET Bob's order (403)" "403" "$CODE" "$(cat /tmp/r.json)"

# Customer cannot create order for another customer
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/orders" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"customerId\":\"$CUST2_ID\",\"items\":[{\"productId\":\"$PROD1_ID\",\"quantity\":1}]}")
check_status "Customer cannot place order for another customer (403)" "403" "$CODE" "$(cat /tmp/r.json)"

# Admin lists ALL orders
R=$(curl -s "$BASE/api/commerce/orders" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin sees all orders" '"success":true' "$R"

# Admin: PENDING → PAID → FULFILLED
R=$(curl -s -X PATCH "$BASE/api/commerce/orders/$ALICE_ORDER_ID/status" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"PAID"}')
check "Admin updates order to PAID" '"status":"PAID"' "$R"

R=$(curl -s -X PATCH "$BASE/api/commerce/orders/$ALICE_ORDER_ID/status" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"FULFILLED"}')
check "Admin updates order to FULFILLED" '"status":"FULFILLED"' "$R"

R=$(curl -s -X PATCH "$BASE/api/commerce/orders/$BOB_ORDER_ID/status" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"CANCELLED"}')
check "Admin cancels Bob order" '"status":"CANCELLED"' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/orders" -H "x-tenant-id: $TENANT")
check_status "GET orders without auth returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# ── 16. PAYMENTS ──────────────────────────────────────────────────────────
echo ""
echo "${BOLD}[16] Payments${NC}"

R=$(curl -s -X POST "$BASE/api/commerce/payments/intent" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"customerId\":\"$CUST1_ID\",\"amount\":149.97}")
check "Create payment intent — REQUIRES_CONFIRMATION" '"status":"REQUIRES_CONFIRMATION"' "$R"
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

# ── 17. CUSTOMERS MANAGEMENT ──────────────────────────────────────────────
echo ""
echo "${BOLD}[17] Customer Management (Admin)${NC}"

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

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" \
  "$BASE/api/commerce/customers/00000000-0000-0000-0000-000000000000" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check_status "GET /customers/:id non-existent returns 404" "404" "$CODE" "$(cat /tmp/r.json)"

# ── 18. SUBSCRIPTIONS (DB-backed) ─────────────────────────────────────────
echo ""
echo "${BOLD}[18] Subscriptions (DB-backed)${NC}"

R=$(curl -s -X POST "$BASE/api/commerce/subscriptions" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"customerId\":\"$CUST1_ID\",\"planCode\":\"PRO_MONTHLY\"}")
check "Alice subscribes to PRO_MONTHLY" '"status":"ACTIVE"' "$R"
check "Subscription persisted with ID" '"id"' "$R"
SUB_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

R=$(curl -s "$BASE/api/commerce/subscriptions" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check "Customer sees their own subscriptions" '"planCode":"PRO_MONTHLY"' "$R"

R=$(curl -s "$BASE/api/commerce/subscriptions" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin sees all subscriptions" '"success":true' "$R"

R=$(curl -s -X PATCH "$BASE/api/commerce/subscriptions/$SUB_ID/cancel" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check "Subscription cancellation returns CANCELLED" '"status":"CANCELLED"' "$R"

# ── 19. MULTI-TENANT ISOLATION ────────────────────────────────────────────
echo ""
echo "${BOLD}[19] Multi-Tenant Isolation${NC}"
TENANT2="test-biz-$RUN"

BOOT2=$(curl -s -X POST "$BASE/api/commerce/auth/bootstrap" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT2" \
  -d "{\"email\":\"owner-$RUN@biz2.com\",\"password\":\"Owner@123\",\"name\":\"Biz 2 Owner\"}")
check "Bootstrap fresh tenant $TENANT2" '"role":"ADMIN"' "$BOOT2"
T2_TOKEN=$(echo "$BOOT2" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

R=$(curl -s "$BASE/api/commerce/catalog/products" -H "x-tenant-id: $TENANT2")
PROD_COUNT=$(echo "$R" | grep -o '"id"' | wc -l | tr -d ' ')
if [ "$PROD_COUNT" = "0" ]; then
  echo -e "  ${GREEN}+${NC} $TENANT2 catalog is isolated (0 products)"
  PASS=$((PASS+1))
else
  echo -e "  ${RED}x${NC} ISOLATION FAILURE: $TENANT2 sees $PROD_COUNT products from $TENANT"
  FAIL=$((FAIL+1))
  ERRORS+=("Multi-tenant catalog isolation")
fi

R=$(curl -s "$BASE/api/commerce/orders" -H "x-tenant-id: $TENANT2" -H "Authorization: Bearer $T2_TOKEN")
ORDER_COUNT=$(echo "$R" | grep -o '"status"' | wc -l | tr -d ' ')
if [ "$ORDER_COUNT" = "0" ]; then
  echo -e "  ${GREEN}+${NC} $TENANT2 orders are isolated (0 orders)"
  PASS=$((PASS+1))
else
  echo -e "  ${RED}x${NC} ISOLATION FAILURE: $TENANT2 sees $ORDER_COUNT orders from $TENANT"
  FAIL=$((FAIL+1))
  ERRORS+=("Multi-tenant order isolation")
fi

R=$(curl -s "$BASE/api/commerce/customers" \
  -H "x-tenant-id: $TENANT2" -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$R" | grep -q "\"email\":\"alice"; then
  echo -e "  ${RED}x${NC} Cross-tenant data leak: $TENANT2 sees $TENANT customers"
  FAIL=$((FAIL+1))
  ERRORS+=("Cross-tenant data leak")
else
  echo -e "  ${GREEN}+${NC} Cross-tenant token does not expose other tenant's customers"
  PASS=$((PASS+1))
fi

# ── SUMMARY ───────────────────────────────────────────────────────────────
TOTAL=$((PASS+FAIL))
echo ""
echo "======================================================================"
echo "  E2E Results: $PASS passed  /  $FAIL failed  /  $TOTAL total"
echo "======================================================================"
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""
  echo "Failed tests:"
  for e in "${ERRORS[@]}"; do echo "  - $e"; done
fi
echo ""
