#!/usr/bin/env bash
# Full Customer + Admin Journey Tests — all edge cases
# Uses a fresh tenant per run so bootstrap always succeeds
# Usage: bash test-journeys.sh

BASE="http://localhost:3003/api/commerce"
TS=$(date +%s)
TENANT="test-run-$TS"          # fresh tenant every run
OTHER_TENANT="other-$TS"
H_JSON="Content-Type: application/json"
H_T="x-tenant-id: $TENANT"
PASS=0; FAIL=0

# ── helpers ──────────────────────────────────────────────────────────────────
c()   { printf "\n\033[1;36m=== %s ===\033[0m\n" "$*"; }
ok()  { printf "\033[32m  PASS\033[0m %s\n" "$*"; ((PASS++)); }
err() { printf "\033[31m  FAIL\033[0m %s — got: %.150s\n" "$*"; ((FAIL++)); }
inf() { printf "       %s\n" "$*"; }

has()  { local l=$1 b=$2 e=$3
         if echo "$b" | grep -qF "$e"; then ok "$l"; else err "$l" "$b"; fi; }
hasnt(){ local l=$1 b=$2 e=$3
         if echo "$b" | grep -qF "$e"; then err "$l" "$b"; else ok "$l"; fi; }

# ─────────────────────────────────────────────────────────────────────────────
c "WEBSITE CONFIG"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s "$BASE/website-config" -H "$H_T")
has   "GET config returns success"      "$R" '"success":true'
has   "config has businessName"         "$R" '"businessName"'
has   "config has primaryColor"         "$R" '"primaryColor"'
has   "config has content field"        "$R" '"content"'

# ─────────────────────────────────────────────────────────────────────────────
c "AUTH — REGISTER"
# ─────────────────────────────────────────────────────────────────────────────
CUST_EMAIL="cust_${TS}@test.com"

R=$(curl -s -X POST "$BASE/auth/register" \
  -H "$H_JSON" -H "$H_T" \
  -d "{\"email\":\"$CUST_EMAIL\",\"password\":\"pass1234\",\"name\":\"Test Customer\"}")
has   "Register new customer"           "$R" '"access_token"'
has   "Register returns CUSTOMER role"  "$R" '"role":"CUSTOMER"'
CUST_TOKEN=$(echo "$R" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
CUST_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
inf "CUST_ID=$CUST_ID"

R=$(curl -s -X POST "$BASE/auth/register" \
  -H "$H_JSON" -H "$H_T" \
  -d "{\"email\":\"$CUST_EMAIL\",\"password\":\"pass1234\",\"name\":\"Dup\"}")
hasnt "Duplicate email rejected"        "$R" '"access_token"'

R=$(curl -s -X POST "$BASE/auth/register" \
  -H "$H_JSON" -H "$H_T" \
  -d '{"email":"bad@test.com"}')
hasnt "Missing password rejected"       "$R" '"access_token"'

R=$(curl -s -X POST "$BASE/auth/register" \
  -H "$H_JSON" -H "$H_T" \
  -d '{"password":"pass"}')
hasnt "Missing email rejected"          "$R" '"access_token"'

# ─────────────────────────────────────────────────────────────────────────────
c "AUTH — LOGIN"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s -X POST "$BASE/auth/login" \
  -H "$H_JSON" -H "$H_T" \
  -d "{\"email\":\"$CUST_EMAIL\",\"password\":\"pass1234\"}")
has   "Login correct credentials"       "$R" '"access_token"'

R=$(curl -s -X POST "$BASE/auth/login" \
  -H "$H_JSON" -H "$H_T" \
  -d "{\"email\":\"$CUST_EMAIL\",\"password\":\"wrong\"}")
hasnt "Login wrong password rejected"   "$R" '"access_token"'

R=$(curl -s -X POST "$BASE/auth/login" \
  -H "$H_JSON" -H "$H_T" \
  -d '{"email":"nobody@test.com","password":"pass"}')
hasnt "Login unknown email rejected"    "$R" '"access_token"'

# ─────────────────────────────────────────────────────────────────────────────
c "AUTH — GET ME"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s "$BASE/auth/me" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN")
has   "GET /me returns success"         "$R" '"success":true'
has   "GET /me has correct email"       "$R" "$CUST_EMAIL"

R=$(curl -s "$BASE/auth/me" -H "$H_T")
hasnt "GET /me without token rejected"  "$R" '"success":true'

R=$(curl -s "$BASE/auth/me" -H "$H_T" -H "Authorization: Bearer invalid.token.here")
hasnt "GET /me invalid token rejected"  "$R" '"success":true'

# ─────────────────────────────────────────────────────────────────────────────
c "ADMIN BOOTSTRAP"
# ─────────────────────────────────────────────────────────────────────────────
ADMIN_EMAIL="admin_${TS}@test.com"

R=$(curl -s -X POST "$BASE/auth/bootstrap" \
  -H "$H_JSON" -H "$H_T" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"adminpass\",\"name\":\"Admin\"}")
has   "Bootstrap admin on fresh tenant" "$R" '"access_token"'
has   "Bootstrap returns ADMIN role"    "$R" '"role":"ADMIN"'
ADMIN_TOKEN=$(echo "$R" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
inf "ADMIN_TOKEN obtained"

R=$(curl -s -X POST "$BASE/auth/bootstrap" \
  -H "$H_JSON" -H "$H_T" \
  -d '{"email":"admin2@test.com","password":"adminpass2","name":"Admin2"}')
hasnt "Second bootstrap rejected"       "$R" '"role":"ADMIN"'
has   "Second bootstrap returns 409"    "$R" '"statusCode":409'

# ─────────────────────────────────────────────────────────────────────────────
c "WEBSITE CONFIG — ADMIN UPDATE"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s -X PATCH "$BASE/website-config" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"businessName":"Test Shop","primaryColor":"#e11d48","content":{"announcement":{"enabled":true,"text":"Free shipping!"},"hero":{"title":"Welcome","ctaText":"Shop Now","ctaLink":"/shop"},"features":[{"icon":"truck","title":"Free Shipping","description":"On all orders"}],"footer":{"contactEmail":"hello@shop.com","socialLinks":{"instagram":"testshop"}}}}')
has   "Admin updates config"            "$R" '"success":true'
has   "businessName updated"            "$R" '"businessName":"Test Shop"'
has   "content.announcement saved"      "$R" '"Free shipping!"'
has   "content.hero saved"              "$R" '"Welcome"'
has   "content.footer saved"            "$R" '"hello@shop.com"'

R=$(curl -s "$BASE/website-config" -H "$H_T")
has   "Config persisted after update"   "$R" '"Test Shop"'

R=$(curl -s -X PATCH "$BASE/website-config" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN" \
  -d '{"businessName":"Hacked"}')
hasnt "Customer cannot update config"   "$R" '"businessName":"Hacked"'

R=$(curl -s -X PATCH "$BASE/website-config" -H "$H_JSON" -H "$H_T" \
  -d '{"businessName":"NoAuth"}')
hasnt "No auth cannot update config"    "$R" '"businessName":"NoAuth"'

# ─────────────────────────────────────────────────────────────────────────────
c "CATEGORIES"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s -X POST "$BASE/catalog/categories" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Electronics","slug":"electronics","description":"Gadgets"}')
has   "Admin create category"           "$R" '"success":true'
has   "Category name correct"           "$R" '"name":"Electronics"'
CAT_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
inf "CAT_ID=$CAT_ID"

R=$(curl -s "$BASE/catalog/categories" -H "$H_T")
has   "Public list categories"          "$R" '"success":true'
has   "Category in list"                "$R" '"Electronics"'

R=$(curl -s -X PATCH "$BASE/catalog/categories/$CAT_ID" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Electronics & Gadgets","isActive":true}')
has   "Admin update category"           "$R" '"Electronics & Gadgets"'

R=$(curl -s -X POST "$BASE/catalog/categories" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN" \
  -d '{"name":"Hack","slug":"hack"}')
hasnt "Customer cannot create category" "$R" '"name":"Hack"'

# ─────────────────────────────────────────────────────────────────────────────
c "PRODUCTS — CRUD"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s -X POST "$BASE/catalog/products" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"title\":\"Test Phone\",\"description\":\"A great phone\",\"price\":299.99,\"currency\":\"USD\",\"categoryId\":\"$CAT_ID\"}")
has   "Admin create product"            "$R" '"success":true'
has   "Product title correct"           "$R" '"Test Phone"'
has   "Product has price"               "$R" '"price"'
PROD_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
inf "PROD_ID=$PROD_ID"

R=$(curl -s -X POST "$BASE/catalog/products" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"Test Headphones","price":49.99,"currency":"USD"}')
has   "Admin create second product"     "$R" '"Test Headphones"'
PROD2_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
inf "PROD2_ID=$PROD2_ID"

R=$(curl -s "$BASE/catalog/products" -H "$H_T")
has   "Public list products"            "$R" '"success":true'
has   "Products has data array"         "$R" '"data"'
has   "Products has total"              "$R" '"total"'

R=$(curl -s "$BASE/catalog/products?search=Test%20Phone" -H "$H_T")
has   "Search by keyword"               "$R" '"Test Phone"'
hasnt "Search filters out others"       "$R" '"Test Headphones"'

R=$(curl -s "$BASE/catalog/products?search=NOMATCH_XYZ_999" -H "$H_T")
has   "Search no match returns total:0" "$R" '"total":0'

R=$(curl -s "$BASE/catalog/products?categoryId=$CAT_ID" -H "$H_T")
has   "Filter by category"              "$R" '"Test Phone"'

R=$(curl -s "$BASE/catalog/products/$PROD_ID" -H "$H_T")
has   "Get single product"              "$R" '"Test Phone"'

R=$(curl -s "$BASE/catalog/products/00000000-0000-0000-0000-000000000000" -H "$H_T")
hasnt "Nonexistent product 404"         "$R" '"title"'

R=$(curl -s -X PATCH "$BASE/catalog/products/$PROD_ID" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"price":249.99,"description":"Updated description"}')
has   "Admin update product"            "$R" '"success":true'

R=$(curl -s -X POST "$BASE/catalog/products" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN" \
  -d '{"title":"Hack","price":1}')
hasnt "Customer cannot create product"  "$R" '"title":"Hack"'

# ─────────────────────────────────────────────────────────────────────────────
c "VARIANTS"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s -X POST "$BASE/catalog/products/$PROD_ID/variants" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"64GB Black","sku":"PHONE-64-BLK","price":299.99,"attributes":{"storage":"64GB","color":"Black"}}')
has   "Admin create variant"            "$R" '"success":true'
has   "Variant title correct"           "$R" '"64GB Black"'
VARIANT_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
inf "VARIANT_ID=$VARIANT_ID"

R=$(curl -s "$BASE/catalog/products/$PROD_ID/variants" -H "$H_T")
has   "Public list variants"            "$R" '"64GB Black"'

R=$(curl -s -X PATCH "$BASE/catalog/products/$PROD_ID/variants/$VARIANT_ID" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"price":279.99,"isActive":true}')
has   "Admin update variant"            "$R" '"success":true'

R=$(curl -s -X DELETE "$BASE/catalog/products/$PROD_ID/variants/$VARIANT_ID" \
  -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN")
hasnt "Customer cannot delete variant"  "$R" '"success":true'

# Recreate variant for cart tests
R=$(curl -s -X POST "$BASE/catalog/products/$PROD_ID/variants" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"128GB White","sku":"PHONE-128-WHT","price":349.99}')
VARIANT_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# ─────────────────────────────────────────────────────────────────────────────
c "INVENTORY"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s -X POST "$BASE/inventory/upsert" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"productId\":\"$PROD_ID\",\"sku\":\"PHONE-STOCK\",\"availableQuantity\":50}")
has   "Admin upsert inventory"          "$R" '"success":true'
has   "Inventory qty correct"           "$R" '"availableQuantity":50'

R=$(curl -s -X POST "$BASE/inventory/upsert" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"productId\":\"$PROD2_ID\",\"sku\":\"HEAD-STOCK\",\"availableQuantity\":100}")
has   "Upsert second product inventory" "$R" '"availableQuantity":100'

R=$(curl -s "$BASE/inventory" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN")
has   "Admin list inventory"            "$R" '"success":true'
has   "Inventory has pagination"        "$R" '"totalPages"'

R=$(curl -s "$BASE/inventory" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN")
hasnt "Customer cannot list inventory"  "$R" '"success":true'

R=$(curl -s "$BASE/inventory" -H "$H_T")
hasnt "No auth cannot list inventory"   "$R" '"success":true'

R=$(curl -s "$BASE/inventory/items/$PROD_ID" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN")
has   "Get inventory by product"        "$R" '"PHONE-STOCK"'

# ─────────────────────────────────────────────────────────────────────────────
c "CART"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s "$BASE/cart/$CUST_ID" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN")
has   "Get cart (empty)"                "$R" '"success":true'
has   "Cart has items array"            "$R" '"items"'

R=$(curl -s -X POST "$BASE/cart/$CUST_ID/items" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN" \
  -d "{\"productId\":\"$PROD_ID\",\"quantity\":2}")
has   "Add item to cart"                "$R" '"success":true'
has   "Cart item has unitTitle"         "$R" '"unitTitle"'
has   "Cart item has unitPrice"         "$R" '"unitPrice"'
ITEM_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | grep -v "$CUST_ID\|$PROD_ID\|$PROD2_ID\|$VARIANT_ID\|$CAT_ID" | head -1 | cut -d'"' -f4)
inf "ITEM_ID=$ITEM_ID"

R=$(curl -s -X POST "$BASE/cart/$CUST_ID/items" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN" \
  -d "{\"productId\":\"$PROD_ID\",\"quantity\":1,\"variantId\":\"$VARIANT_ID\"}")
has   "Add item with variant"           "$R" '"success":true'

R=$(curl -s -X PATCH "$BASE/cart/$CUST_ID/items/$ITEM_ID" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN" \
  -d '{"quantity":3}')
has   "Update cart item qty"            "$R" '"success":true'

R=$(curl -s -X PATCH "$BASE/cart/$CUST_ID/items/$ITEM_ID" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN" \
  -d '{"quantity":0}')
hasnt "Zero qty rejected (min 1)"       "$R" '"quantity":0'

R=$(curl -s "$BASE/cart/$CUST_ID" -H "$H_T")
hasnt "Cart requires auth"              "$R" '"unitTitle"'

# Another customer cannot access first customer's cart
CUST2_R=$(curl -s -X POST "$BASE/auth/register" \
  -H "$H_JSON" -H "$H_T" \
  -d "{\"email\":\"cust2_${TS}@test.com\",\"password\":\"pass1234\",\"name\":\"Customer2\"}")
CUST2_TOKEN=$(echo "$CUST2_R" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
CUST2_ID=$(echo "$CUST2_R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

R=$(curl -s "$BASE/cart/$CUST_ID" -H "$H_T" -H "Authorization: Bearer $CUST2_TOKEN")
hasnt "Customer2 cannot access Customer1 cart" "$R" '"unitTitle"'

# Remove variant item (cleanup)
CART_STATE=$(curl -s "$BASE/cart/$CUST_ID" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN")
VARIANT_ITEM_ID=$(echo "$CART_STATE" | python -c "
import sys,json
d=json.load(sys.stdin)
items=d.get('data',{}).get('items',[])
for i in items:
    if i.get('variantId'):
        print(i['id']); break
" 2>/dev/null)
if [ -n "$VARIANT_ITEM_ID" ]; then
  R=$(curl -s -X DELETE "$BASE/cart/$CUST_ID/items/$VARIANT_ITEM_ID" \
    -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN")
  has "Remove variant cart item"        "$R" '"success":true'
fi

# ─────────────────────────────────────────────────────────────────────────────
c "CHECKOUT — BEGIN"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s -X POST "$BASE/checkout/begin" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN" \
  -d "{\"customerId\":\"$CUST_ID\"}")
has   "Begin checkout"                  "$R" '"success":true'
has   "Begin has cart"                  "$R" '"cart"'
has   "Begin status READY"              "$R" '"READY_FOR_PAYMENT"'

R=$(curl -s -X POST "$BASE/checkout/begin" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST2_TOKEN" \
  -d "{\"customerId\":\"$CUST2_ID\"}")
hasnt "Empty cart begin rejected"       "$R" '"READY_FOR_PAYMENT"'
has   "Empty cart error message"        "$R" 'Cart is empty'

# ─────────────────────────────────────────────────────────────────────────────
c "CHECKOUT — COMPLETE"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s -X POST "$BASE/checkout/complete" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN" \
  -d "{\"customerId\":\"$CUST_ID\",\"shippingAddress\":{\"name\":\"Test Customer\",\"line1\":\"123 Main St\",\"city\":\"New York\",\"postalCode\":\"10001\",\"country\":\"US\"}}")
has   "Complete checkout"               "$R" '"success":true'
has   "Checkout returns order"          "$R" '"order"'
has   "Order status PENDING"            "$R" '"status":"PENDING"'
has   "Shipping name saved"             "$R" '"shippingName":"Test Customer"'
has   "Shipping line1 saved"            "$R" '"shippingLine1":"123 Main St"'
has   "Shipping city saved"             "$R" '"shippingCity":"New York"'
has   "Shipping country saved"          "$R" '"shippingCountry":"US"'
has   "Order has items"                 "$R" '"unitTitle"'
has   "Order has totalAmount"           "$R" '"totalAmount"'
ORDER_ID=$(echo "$R" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('order',{}).get('id',''))" 2>/dev/null)
inf "ORDER_ID=$ORDER_ID"

R=$(curl -s "$BASE/cart/$CUST_ID" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN")
has   "Cart cleared after checkout"     "$R" '"items":[]'

# Checkout with empty cart fails
R=$(curl -s -X POST "$BASE/checkout/complete" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN" \
  -d "{\"customerId\":\"$CUST_ID\"}")
hasnt "Re-checkout empty cart fails"    "$R" '"status":"PENDING"'
has   "Empty cart checkout error"       "$R" 'Cart is empty'

# ─────────────────────────────────────────────────────────────────────────────
c "ORDERS — CUSTOMER"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s "$BASE/orders" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN")
has   "Customer list own orders"        "$R" '"success":true'
has   "Orders has pagination"           "$R" '"totalPages"'

R=$(curl -s "$BASE/orders/$ORDER_ID" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN")
has   "Customer get own order"          "$R" '"success":true'
has   "Order detail has items"          "$R" '"unitTitle"'
has   "Order has shipping address"      "$R" '"shippingLine1"'

R=$(curl -s "$BASE/orders/$ORDER_ID" -H "$H_T" -H "Authorization: Bearer $CUST2_TOKEN")
hasnt "Cust2 cannot see Cust1 order"    "$R" '"shippingLine1"'

R=$(curl -s "$BASE/orders" -H "$H_T")
hasnt "Orders requires auth"            "$R" '"success":true'

# ─────────────────────────────────────────────────────────────────────────────
c "ORDER CANCEL — CUSTOMER"
# ─────────────────────────────────────────────────────────────────────────────
# Create a cancellable order for cust2
curl -s -X POST "$BASE/cart/$CUST2_ID/items" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST2_TOKEN" \
  -d "{\"productId\":\"$PROD2_ID\",\"quantity\":1}" > /dev/null
R=$(curl -s -X POST "$BASE/checkout/complete" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST2_TOKEN" \
  -d "{\"customerId\":\"$CUST2_ID\"}")
ORDER2_ID=$(echo "$R" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('order',{}).get('id',''))" 2>/dev/null)
inf "ORDER2_ID=$ORDER2_ID"

R=$(curl -s -X PATCH "$BASE/orders/$ORDER2_ID/cancel" \
  -H "$H_T" -H "Authorization: Bearer $CUST2_TOKEN")
has   "Customer cancel own PENDING order"     "$R" '"CANCELLED"'

R=$(curl -s -X PATCH "$BASE/orders/$ORDER2_ID/cancel" \
  -H "$H_T" -H "Authorization: Bearer $CUST2_TOKEN")
hasnt "Cancel already CANCELLED fails"        "$R" '"success":true'
has   "Cancel terminal state error"           "$R" 'Only PENDING orders'

R=$(curl -s -X PATCH "$BASE/orders/$ORDER2_ID/cancel" \
  -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN")
hasnt "Cust1 cannot cancel Cust2 order"       "$R" '"success":true'

# ─────────────────────────────────────────────────────────────────────────────
c "ORDERS — ADMIN STATUS WORKFLOW"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s "$BASE/orders" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN")
has   "Admin list all orders"           "$R" '"success":true'

R=$(curl -s -X PATCH "$BASE/orders/$ORDER_ID/status" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"PAID"}')
has   "Admin mark PAID"                 "$R" '"PAID"'

R=$(curl -s -X PATCH "$BASE/orders/$ORDER_ID/status" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"FULFILLED"}')
has   "Admin mark FULFILLED"            "$R" '"FULFILLED"'

R=$(curl -s -X PATCH "$BASE/orders/$ORDER_ID/status" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"PENDING"}')
hasnt "Cannot go back from FULFILLED"   "$R" '"status":"PENDING"'
has   "Invalid transition returns error" "$R" 'Cannot transition'

R=$(curl -s -X PATCH "$BASE/orders/$ORDER_ID/status" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN" \
  -d '{"status":"CANCELLED"}')
hasnt "Customer cannot update status"   "$R" '"success":true'

# ─────────────────────────────────────────────────────────────────────────────
c "INSUFFICIENT STOCK EDGE CASE"
# ─────────────────────────────────────────────────────────────────────────────
# Set stock to 0 for PROD_ID
curl -s -X POST "$BASE/inventory/upsert" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"productId\":\"$PROD_ID\",\"sku\":\"PHONE-STOCK\",\"availableQuantity\":0}" > /dev/null

# Register fresh customer, add to cart, try checkout
CUST3_R=$(curl -s -X POST "$BASE/auth/register" \
  -H "$H_JSON" -H "$H_T" \
  -d "{\"email\":\"cust3_${TS}@test.com\",\"password\":\"pass1234\",\"name\":\"Cust3\"}")
CUST3_TOKEN=$(echo "$CUST3_R" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
CUST3_ID=$(echo "$CUST3_R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

curl -s -X POST "$BASE/cart/$CUST3_ID/items" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST3_TOKEN" \
  -d "{\"productId\":\"$PROD_ID\",\"quantity\":1}" > /dev/null

R=$(curl -s -X POST "$BASE/checkout/complete" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST3_TOKEN" \
  -d "{\"customerId\":\"$CUST3_ID\"}")
hasnt "Checkout fails with 0 stock"     "$R" '"status":"PENDING"'
has   "0 stock returns insufficient"    "$R" 'nsufficien'

# Exceed available stock
curl -s -X POST "$BASE/inventory/upsert" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"productId\":\"$PROD_ID\",\"sku\":\"PHONE-STOCK\",\"availableQuantity\":2}" > /dev/null

CUST4_R=$(curl -s -X POST "$BASE/auth/register" \
  -H "$H_JSON" -H "$H_T" \
  -d "{\"email\":\"cust4_${TS}@test.com\",\"password\":\"pass1234\",\"name\":\"Cust4\"}")
CUST4_TOKEN=$(echo "$CUST4_R" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
CUST4_ID=$(echo "$CUST4_R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

curl -s -X POST "$BASE/cart/$CUST4_ID/items" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST4_TOKEN" \
  -d "{\"productId\":\"$PROD_ID\",\"quantity\":99}" > /dev/null

R=$(curl -s -X POST "$BASE/checkout/complete" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST4_TOKEN" \
  -d "{\"customerId\":\"$CUST4_ID\"}")
hasnt "Checkout fails exceeding stock"  "$R" '"status":"PENDING"'

# Restore stock
curl -s -X POST "$BASE/inventory/upsert" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"productId\":\"$PROD_ID\",\"sku\":\"PHONE-STOCK\",\"availableQuantity\":50}" > /dev/null

# ─────────────────────────────────────────────────────────────────────────────
c "PRODUCT SOFT DELETE"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s -X POST "$BASE/catalog/products" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"Temp Product","price":9.99}')
TEMP_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

R=$(curl -s -X DELETE "$BASE/catalog/products/$TEMP_ID" \
  -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN")
has   "Admin soft delete product"       "$R" '"success":true'

R=$(curl -s "$BASE/catalog/products/$TEMP_ID" -H "$H_T")
hasnt "Deleted product not accessible"  "$R" '"Temp Product"'

R=$(curl -s "$BASE/catalog/products?search=Temp" -H "$H_T")
hasnt "Deleted product not in search"   "$R" '"Temp Product"'

R=$(curl -s -X DELETE "$BASE/catalog/products/$TEMP_ID" \
  -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN")
hasnt "Customer cannot delete product"  "$R" '"success":true'

# ─────────────────────────────────────────────────────────────────────────────
c "PAGINATION"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s "$BASE/catalog/products?page=1&limit=1" -H "$H_T")
has   "Limit=1 returns 1 item"          "$R" '"limit":1'
ITEMS_COUNT=$(echo "$R" | python -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',[])))" 2>/dev/null)
[ "$ITEMS_COUNT" = "1" ] && ok "Exactly 1 item returned" || err "Expected 1 item, got $ITEMS_COUNT" "$R"

R=$(curl -s "$BASE/catalog/products?page=9999&limit=20" -H "$H_T")
has   "Out-of-range page returns empty data" "$R" '"data":[]'

R=$(curl -s "$BASE/orders?page=1" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN")
has   "Orders pagination works"         "$R" '"totalPages"'
has   "Orders has limit field"          "$R" '"limit"'

# ─────────────────────────────────────────────────────────────────────────────
c "CROSS-TENANT ISOLATION"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s "$BASE/catalog/products" -H "x-tenant-id: $OTHER_TENANT")
has   "Other tenant catalog is empty"   "$R" '"data":[]'

R=$(curl -s "$BASE/website-config" -H "x-tenant-id: $OTHER_TENANT")
has   "Other tenant gets its own config" "$R" '"success":true'
hasnt "Other tenant config isolated"    "$R" '"businessName":"Test Shop"'

R=$(curl -s "$BASE/orders" -H "x-tenant-id: $OTHER_TENANT" -H "Authorization: Bearer $CUST_TOKEN")
has   "TenantA orders not visible on TenantB"  "$R" '"data":[]'

# ─────────────────────────────────────────────────────────────────────────────
c "AUTH — UPDATE PROFILE"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s -X PATCH "$BASE/auth/profile" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN" \
  -d '{"name":"Updated Name"}')
has   "Update profile name"             "$R" '"success":true'
has   "Name updated in response"        "$R" '"Updated Name"'

R=$(curl -s -X PATCH "$BASE/auth/profile" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN" \
  -d '{"currentPassword":"pass1234","newPassword":"newpass123"}')
has   "Change password success"         "$R" '"success":true'

R=$(curl -s -X PATCH "$BASE/auth/profile" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN" \
  -d '{"currentPassword":"wrongpass","newPassword":"newpass123"}')
hasnt "Wrong current password rejected" "$R" '"success":true'

R=$(curl -s -X PATCH "$BASE/auth/profile" -H "$H_JSON" -H "$H_T" \
  -d '{"name":"NoAuth"}')
hasnt "Profile update requires auth"    "$R" '"success":true'

# ─────────────────────────────────────────────────────────────────────────────
c "CUSTOMERS — ADMIN"
# ─────────────────────────────────────────────────────────────────────────────
# customers table is a separate CRM entity — create one first
R=$(curl -s -X POST "$BASE/customers" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"email\":\"crm_${TS}@test.com\",\"name\":\"CRM Customer\"}")
has   "Admin create CRM customer"       "$R" '"success":true'
CRM_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

R=$(curl -s "$BASE/customers" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN")
has   "Admin list customers"            "$R" '"success":true'
has   "Customers has data array"        "$R" '"data"'
has   "CRM customer in list"            "$R" "crm_${TS}@test.com"

R=$(curl -s "$BASE/customers" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN")
hasnt "Customer cannot list customers"  "$R" '"success":true'

R=$(curl -s "$BASE/customers/$CRM_ID" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN")
has   "Admin get single customer"       "$R" '"success":true'
has   "Customer detail has email"       "$R" "crm_${TS}@test.com"

R=$(curl -s -X PATCH "$BASE/customers/$CRM_ID" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Updated CRM Name"}')
has   "Admin update CRM customer"       "$R" '"Updated CRM Name"'

R=$(curl -s "$BASE/customers/00000000-0000-0000-0000-000000000000" \
  -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN")
hasnt "Nonexistent customer 404"        "$R" '"success":true'

# ─────────────────────────────────────────────────────────────────────────────
c "SHIPPING METHODS"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s -X POST "$BASE/shipping/methods" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"code":"standard","label":"Standard Shipping (3-5 days)","flatRate":5.99,"currency":"USD","active":true}')
has   "Admin create shipping method"    "$R" '"success":true'
has   "Method label correct"            "$R" '"Standard Shipping'
SHIP_ID=$(echo "$R" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

R=$(curl -s -X POST "$BASE/shipping/methods" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"code":"express","label":"Express Shipping (1-2 days)","flatRate":14.99,"currency":"USD","active":true}')
has   "Admin create express method"     "$R" '"Express Shipping'

R=$(curl -s "$BASE/shipping/methods" -H "$H_T")
has   "Public list shipping methods"    "$R" '"success":true'
has   "Standard method in list"         "$R" '"standard"'
has   "Express method in list"          "$R" '"express"'

R=$(curl -s -X PATCH "$BASE/shipping/methods/$SHIP_ID" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flatRate":4.99,"label":"Standard Shipping (3-5 days)"}')
has   "Admin update shipping method"    "$R" '"success":true'

R=$(curl -s -X POST "$BASE/shipping/methods" \
  -H "$H_JSON" -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN" \
  -d '{"code":"hack","label":"Hack","flatRate":0}')
hasnt "Customer cannot create method"   "$R" '"success":true'

R=$(curl -s -X DELETE "$BASE/shipping/methods/$SHIP_ID" \
  -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN")
has   "Admin delete shipping method"    "$R" '"success":true'

R=$(curl -s -X DELETE "$BASE/shipping/methods/$SHIP_ID" \
  -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN")
hasnt "Customer cannot delete method"   "$R" '"success":true'

# ─────────────────────────────────────────────────────────────────────────────
c "CATEGORY DELETE"
# ─────────────────────────────────────────────────────────────────────────────
R=$(curl -s -X DELETE "$BASE/catalog/categories/$CAT_ID" \
  -H "$H_T" -H "Authorization: Bearer $ADMIN_TOKEN")
has   "Admin delete category"           "$R" '"success":true'

R=$(curl -s -X DELETE "$BASE/catalog/categories/$CAT_ID" \
  -H "$H_T" -H "Authorization: Bearer $CUST_TOKEN")
hasnt "Customer cannot delete category" "$R" '"success":true'

# ─────────────────────────────────────────────────────────────────────────────
printf "\n════════════════════════════════════════\n"
printf " RESULTS\n"
printf "════════════════════════════════════════\n"
printf " \033[32mPASS: %d\033[0m\n" $PASS
printf " \033[31mFAIL: %d\033[0m\n" $FAIL
printf "════════════════════════════════════════\n"
if [ $FAIL -eq 0 ]; then
  printf "\n \033[1;32m✓ ALL TESTS PASSED\033[0m\n\n"
else
  printf "\n \033[1;31m✗ %d TEST(S) FAILED\033[0m\n\n" $FAIL
  exit 1
fi
