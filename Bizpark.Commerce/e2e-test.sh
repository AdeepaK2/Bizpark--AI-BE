#!/usr/bin/env bash
BASE="http://localhost:3003"
TENANT="test-biz-1"
RUN=$(date +%s)   # unique suffix per run — avoids DB unique constraint clashes
PASS=0
FAIL=0
ERRORS=()

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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
    echo -e "    Expected to contain: $expected"
    echo -e "    Got: $actual"
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
echo "====================================================="
echo "  Bizpark.Commerce -- E2E API Test Suite"
echo "====================================================="
echo ""

# --- 1. HEALTH ---
echo "${BOLD}[1] Health Check${NC}"
R=$(curl -s "$BASE/")
check "GET / returns ok status" '"status":"ok"' "$R"
check "GET / returns service name" '"service":"bizpark-commerce"' "$R"
check "GET / has timestamp" '"timestamp"' "$R"

# --- 2. BOOTSTRAP GUARD ---
echo ""
echo "${BOLD}[2] Bootstrap Guard${NC}"
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/auth/bootstrap" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"email":"admin2@testbiz.com","password":"Admin@123","name":"Second Admin"}')
BODY=$(cat /tmp/r.json)
check_status "POST /auth/bootstrap returns 409 when admin exists" "409" "$CODE" "$BODY"
check "409 body mentions conflict" "already exists" "$BODY"

# --- 3. ADMIN LOGIN ---
echo ""
echo "${BOLD}[3] Admin Login${NC}"
ADMIN_RESP=$(curl -s -X POST "$BASE/api/commerce/auth/login" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"email":"admin@testbiz.com","password":"Admin@123"}')
ADMIN_TOKEN=$(echo "$ADMIN_RESP" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
check "Admin login returns access_token" '"access_token"' "$ADMIN_RESP"
check "Admin login role is ADMIN" '"role":"ADMIN"' "$ADMIN_RESP"

# --- 4. AUTH EDGE CASES ---
echo ""
echo "${BOLD}[4] Auth Edge Cases${NC}"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/auth/login" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"email":"admin@testbiz.com","password":"wrongpassword"}')
check_status "Login with wrong password returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/auth/login" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"email":"nobody@testbiz.com","password":"anything"}')
check_status "Login unknown email returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# Register then try duplicate
curl -s -X POST "$BASE/api/commerce/auth/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"email\":\"dup-$RUN@testbiz.com\",\"password\":\"pass\",\"name\":\"First\"}" > /dev/null
CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/auth/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"email\":\"dup-$RUN@testbiz.com\",\"password\":\"pass\",\"name\":\"Dupe\"}")
check_status "Duplicate email registration returns 400" "400" "$CODE" "$(cat /tmp/r.json)"

# --- 5. GET /ME ---
echo ""
echo "${BOLD}[5] Auth Me${NC}"
ME_RESP=$(curl -s "$BASE/api/commerce/auth/me" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "GET /me returns success:true" '"success":true' "$ME_RESP"
check "GET /me returns ADMIN role" '"role":"ADMIN"' "$ME_RESP"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/auth/me" \
  -H "x-tenant-id: $TENANT")
check_status "GET /me without token returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# --- 6. ADMIN CREATES ANOTHER ADMIN ---
echo ""
echo "${BOLD}[6] Admin Creates Another Admin${NC}"
ADMIN2_RESP=$(curl -s -X POST "$BASE/api/commerce/auth/admin/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"email\":\"admin2-$RUN@testbiz.com\",\"password\":\"Admin2@123\",\"name\":\"Second Admin\"}")
check "Admin can create another admin" '"role":"ADMIN"' "$ADMIN2_RESP"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/auth/admin/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"email":"noaccess@test.com","password":"pass","name":"No Auth"}')
check_status "admin/register without token returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# --- 7. SHIPPING ---
echo ""
echo "${BOLD}[7] Shipping Methods${NC}"

R=$(curl -s "$BASE/api/commerce/shipping/methods" -H "x-tenant-id: $TENANT")
check "GET /shipping/methods is public (no auth needed)" '"success":true' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/shipping/methods" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"code\":\"standard-$RUN\",\"label\":\"Standard Shipping\",\"flatRate\":5.99,\"currency\":\"USD\",\"active\":true}")
check "Admin creates standard shipping method" "\"code\":\"standard-$RUN\"" "$R"
STD_CODE="standard-$RUN"

R=$(curl -s -X POST "$BASE/api/commerce/shipping/methods" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"code\":\"express-$RUN\",\"label\":\"Express Delivery\",\"flatRate\":14.99,\"currency\":\"USD\",\"active\":true}")
check "Admin creates express shipping method" "\"code\":\"express-$RUN\"" "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/shipping/methods" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"code":"noauth","label":"No Auth","flatRate":1}')
check_status "Create shipping method without token returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

R=$(curl -s -X POST "$BASE/api/commerce/shipping/quote" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"methodCode\":\"$STD_CODE\",\"weightKg\":2,\"orderSubtotal\":50}")
check "Shipping quote for standard method" '"success":true' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/shipping/quote" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"methodCode\":\"$STD_CODE\",\"orderSubtotal\":150}")
check "Shipping free for orders over $100" '"amount":0' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/shipping/quote" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"methodCode":"nonexistent"}')
check "Shipping quote for unknown method returns failure" '"success":false' "$R"

# --- 8. CATALOG ---
echo ""
echo "${BOLD}[8] Catalog Products${NC}"

R=$(curl -s "$BASE/api/commerce/catalog/products" -H "x-tenant-id: $TENANT")
check "GET /catalog/products is public" '"success":true' "$R"

P1=$(curl -s -X POST "$BASE/api/commerce/catalog/products" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"Blue T-Shirt","description":"Comfortable cotton tee","price":29.99,"currency":"USD"}')
check "Admin creates product (T-Shirt)" '"title":"Blue T-Shirt"' "$P1"
PROD1_ID=$(echo "$P1" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

P2=$(curl -s -X POST "$BASE/api/commerce/catalog/products" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"Running Shoes","price":89.99}')
check "Admin creates product with default currency USD" '"currency":"USD"' "$P2"
PROD2_ID=$(echo "$P2" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

P3=$(curl -s -X POST "$BASE/api/commerce/catalog/products" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"Laptop Bag","price":49.99,"description":"Water resistant bag"}')
check "Admin creates product (Laptop Bag)" '"title":"Laptop Bag"' "$P3"
PROD3_ID=$(echo "$P3" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/catalog/products" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"title":"Hacker Product","price":1}')
check_status "Create product without auth returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

R=$(curl -s "$BASE/api/commerce/catalog/products" -H "x-tenant-id: $TENANT")
check "GET products returns created products" '"title":"Blue T-Shirt"' "$R"

# --- 9. INVENTORY ---
echo ""
echo "${BOLD}[9] Inventory Management${NC}"

R=$(curl -s -X POST "$BASE/api/commerce/inventory/upsert" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"productId\":\"$PROD1_ID\",\"sku\":\"TSHIRT-BLUE-M\",\"availableQuantity\":50}")
check "Admin adds inventory for T-Shirt (qty=50)" '"sku":"TSHIRT-BLUE-M"' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/inventory/upsert" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"productId\":\"$PROD2_ID\",\"sku\":\"SHOES-RUN-42\",\"availableQuantity\":20}")
check "Admin adds inventory for Shoes (qty=20)" '"sku":"SHOES-RUN-42"' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/inventory/upsert" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"productId\":\"$PROD3_ID\",\"sku\":\"BAG-LAPTOP-BLK\",\"availableQuantity\":3}")
check "Admin adds inventory for Laptop Bag (qty=3)" '"availableQuantity":3' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/inventory/upsert" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"productId\":\"$PROD1_ID\",\"sku\":\"TSHIRT-BLUE-XS\",\"availableQuantity\":-5}")
check "Negative qty clamped to 0" '"availableQuantity":0' "$R"

R=$(curl -s "$BASE/api/commerce/inventory" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin lists all inventory" '"success":true' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/inventory" \
  -H "x-tenant-id: $TENANT")
check_status "GET inventory without auth returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

R=$(curl -s -X POST "$BASE/api/commerce/inventory/reserve" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"sku":"BAG-LAPTOP-BLK","quantity":2}')
check "Reserve 2 of 3 laptop bags succeeds" '"success":true' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/inventory/reserve" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"sku":"BAG-LAPTOP-BLK","quantity":99}')
check "Reserve 99 when only 1 left returns failure" '"success":false' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/inventory/reserve" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"sku":"NONEXISTENT-SKU","quantity":1}')
check "Reserve unknown SKU returns failure" '"success":false' "$R"

# --- 10. CUSTOMER REGISTRATION ---
echo ""
echo "${BOLD}[10] Customer Registration${NC}"

CUST1=$(curl -s -X POST "$BASE/api/commerce/auth/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"email\":\"alice-$RUN@shopper.com\",\"password\":\"Alice@123\",\"name\":\"Alice Smith\"}")
check "Customer Alice registers with CUSTOMER role" '"role":"CUSTOMER"' "$CUST1"
CUST1_TOKEN=$(echo "$CUST1" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
CUST1_ID=$(echo "$CUST1" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

CUST2=$(curl -s -X POST "$BASE/api/commerce/auth/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"email\":\"bob-$RUN@shopper.com\",\"password\":\"Bob@123\",\"name\":\"Bob Jones\"}")
check "Customer Bob registers with CUSTOMER role" '"role":"CUSTOMER"' "$CUST2"
CUST2_TOKEN=$(echo "$CUST2" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
CUST2_ID=$(echo "$CUST2" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

R=$(curl -s -X POST "$BASE/api/commerce/auth/register" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"email\":\"CHARLIE-$RUN@SHOPPER.COM\",\"password\":\"pass\",\"name\":\"Charlie\"}")
check "Email normalized to lowercase on register" "\"email\":\"charlie-$RUN@shopper.com\"" "$R"

# --- 11. ROLE-BASED ACCESS CONTROL ---
echo ""
echo "${BOLD}[11] Role-Based Access Control${NC}"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/customers" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check_status "Customer cannot access admin /customers returns 403" "403" "$CODE" "$(cat /tmp/r.json)"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/inventory" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check_status "Customer cannot access admin /inventory returns 403" "403" "$CODE" "$(cat /tmp/r.json)"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/orders" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check_status "Customer cannot list all orders (admin only) returns 403" "403" "$CODE" "$(cat /tmp/r.json)"

R=$(curl -s "$BASE/api/commerce/customers" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin CAN access /customers" '"success":true' "$R"

# --- 12. CART ---
echo ""
echo "${BOLD}[12] Cart Operations${NC}"

R=$(curl -s "$BASE/api/commerce/cart/$CUST1_ID" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $CUST1_TOKEN")
check "GET cart for new customer returns success" '"success":true' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/cart/$CUST1_ID/items" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"productId\":\"$PROD1_ID\",\"quantity\":2}")
check "Add T-Shirt x2 to Alice cart" '"success":true' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/cart/$CUST1_ID/items" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"productId\":\"$PROD2_ID\",\"quantity\":1}")
check "Add Shoes x1 to Alice cart" '"success":true' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/cart/$CUST1_ID/items" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"productId\":\"$PROD1_ID\",\"quantity\":1}")
check "Add same product again (qty increments)" '"success":true' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/cart/$CUST2_ID/items" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST2_TOKEN" \
  -d "{\"productId\":\"$PROD3_ID\",\"quantity\":1}")
check "Add Laptop Bag to Bob cart" '"success":true' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/cart/$CUST1_ID" \
  -H "x-tenant-id: $TENANT")
check_status "GET cart without token returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# --- 13. CHECKOUT ---
echo ""
echo "${BOLD}[13] Checkout${NC}"

R=$(curl -s -X POST "$BASE/api/commerce/checkout/begin" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"customerId\":\"$CUST1_ID\"}")
check "Alice begins checkout" '"success":true' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/checkout/complete" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"customerId\":\"$CUST1_ID\"}")
check "Alice completes checkout" '"success":true' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" -X POST "$BASE/api/commerce/checkout/begin" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d "{\"customerId\":\"$CUST1_ID\"}")
check_status "Checkout without token returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# --- 14. ORDERS ---
echo ""
echo "${BOLD}[14] Orders${NC}"

R=$(curl -s -X POST "$BASE/api/commerce/orders" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"customerId\":\"$CUST1_ID\",\"items\":[{\"productId\":\"$PROD1_ID\",\"quantity\":2},{\"productId\":\"$PROD2_ID\",\"quantity\":1}]}")
check "Alice places order with PENDING status" '"status":"PENDING"' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/orders" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST2_TOKEN" \
  -d "{\"customerId\":\"$CUST2_ID\",\"items\":[{\"productId\":\"$PROD3_ID\",\"quantity\":1}]}")
check "Bob places order with PENDING status" '"status":"PENDING"' "$R"

R=$(curl -s "$BASE/api/commerce/orders" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin lists all orders" '"success":true' "$R"

CODE=$(curl -s -o /tmp/r.json -w "%{http_code}" "$BASE/api/commerce/orders" \
  -H "x-tenant-id: $TENANT")
check_status "GET orders without auth returns 401" "401" "$CODE" "$(cat /tmp/r.json)"

# --- 15. PAYMENTS ---
echo ""
echo "${BOLD}[15] Payments${NC}"

R=$(curl -s -X POST "$BASE/api/commerce/payments/intent" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"customerId\":\"$CUST1_ID\",\"amount\":149.97}")
check "Create payment intent with REQUIRES_CONFIRMATION status" '"status":"REQUIRES_CONFIRMATION"' "$R"
check "Payment provider is STRIPE" '"provider":"STRIPE"' "$R"
check "Payment defaults to USD currency" '"currency":"USD"' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/payments/intent" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $CUST1_TOKEN" \
  -d "{\"customerId\":\"$CUST1_ID\",\"amount\":18500,\"currency\":\"LKR\"}")
check "Payment intent with LKR currency" '"currency":"LKR"' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/payments/webhook" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -d '{"type":"payment.succeeded","data":{"id":"pi_test_123"}}')
check "Payment webhook accepted" '"accepted":true' "$R"

# --- 16. CUSTOMERS MANAGEMENT ---
echo ""
echo "${BOLD}[16] Customer Management (Admin)${NC}"

R=$(curl -s "$BASE/api/commerce/customers" \
  -H "x-tenant-id: $TENANT" -H "Authorization: Bearer $ADMIN_TOKEN")
check "Admin lists all customers" '"success":true' "$R"

R=$(curl -s -X POST "$BASE/api/commerce/customers" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"email\":\"wholesale-$RUN@partner.com\",\"name\":\"Wholesale Partner\"}")
check "Admin creates B2B customer record" "\"email\":\"wholesale-$RUN@partner.com\"" "$R"

R=$(curl -s -X POST "$BASE/api/commerce/customers" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"email\":\"guest-$RUN@noemail.com\"}")
check "Admin creates customer without name (name=null)" '"name":null' "$R"

# --- 17. MULTI-TENANT ISOLATION ---
echo ""
echo "${BOLD}[17] Multi-Tenant Isolation${NC}"
TENANT2="test-biz-2"

BOOT2=$(curl -s -X POST "$BASE/api/commerce/auth/bootstrap" \
  -H "Content-Type: application/json" -H "x-tenant-id: $TENANT2" \
  -d "{\"email\":\"owner-$RUN@biz2.com\",\"password\":\"Owner@123\",\"name\":\"Biz 2 Owner\"}")
check "Bootstrap second tenant test-biz-2 succeeds" '"role":"ADMIN"' "$BOOT2"
T2_TOKEN=$(echo "$BOOT2" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

R=$(curl -s "$BASE/api/commerce/catalog/products" -H "x-tenant-id: $TENANT2")
PROD_COUNT=$(echo "$R" | grep -o '"id"' | wc -l | tr -d ' ')
if [ "$PROD_COUNT" = "0" ]; then
  echo -e "  ${GREEN}+${NC} test-biz-2 catalog is isolated (0 products from test-biz-1)"
  PASS=$((PASS+1))
else
  echo -e "  ${RED}x${NC} ISOLATION FAILURE: test-biz-2 sees $PROD_COUNT products from test-biz-1"
  FAIL=$((FAIL+1))
  ERRORS+=("Multi-tenant catalog isolation")
fi

R=$(curl -s "$BASE/api/commerce/orders" -H "x-tenant-id: $TENANT2" -H "Authorization: Bearer $T2_TOKEN")
ORDER_COUNT=$(echo "$R" | grep -o '"status"' | wc -l | tr -d ' ')
if [ "$ORDER_COUNT" = "0" ]; then
  echo -e "  ${GREEN}+${NC} test-biz-2 orders are isolated (0 orders from test-biz-1)"
  PASS=$((PASS+1))
else
  echo -e "  ${RED}x${NC} ISOLATION FAILURE: test-biz-2 sees $ORDER_COUNT orders from test-biz-1"
  FAIL=$((FAIL+1))
  ERRORS+=("Multi-tenant order isolation")
fi

# Cross-tenant token should not expose other tenant data
R=$(curl -s "$BASE/api/commerce/customers" \
  -H "x-tenant-id: $TENANT2" -H "Authorization: Bearer $ADMIN_TOKEN")
if echo "$R" | grep -q '"email":"alice@shopper.com"'; then
  echo -e "  ${RED}x${NC} Cross-tenant token exposes tenant-1 customer data in tenant-2"
  FAIL=$((FAIL+1))
  ERRORS+=("Cross-tenant data leak")
else
  echo -e "  ${GREEN}+${NC} Cross-tenant token does not expose other tenant customers"
  PASS=$((PASS+1))
fi

# --- SUMMARY ---
TOTAL=$((PASS+FAIL))
echo ""
echo "====================================================="
echo "  E2E Results: $PASS passed  /  $FAIL failed  /  $TOTAL total"
echo "====================================================="
if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""
  echo "Failed tests:"
  for e in "${ERRORS[@]}"; do echo "  - $e"; done
fi
echo ""
