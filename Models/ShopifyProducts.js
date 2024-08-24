// models/ShopifyProduct.js
const mongoose = require('mongoose');
const optionSchema = new mongoose.Schema({
    id: String,
    product_id: String,
    name: String,
    values: [String], // List of option values, e.g., ["Small", "Medium", "Large"]
});

const variantSchema = new mongoose.Schema({
    id: String,
    title: String,
    option1: String,
    option2: String,
    option3: String,
    price: String,
    sku: String,
    position: Number,
    inventory_policy: String,
    compare_at_price: String,
    fulfillment_service: String,
    inventory_management: String,
    option_values: [String],
    taxable: Boolean,
    barcode: String,
    grams: Number,
    image_id: String,
    weight: Number,
    weight_unit: String,
    inventory_item_id: String,
    inventory_quantity: Number,
    old_inventory_quantity: Number,
    requires_shipping: Boolean,
    admin_graphql_api_id: String,
});

const shopifyProductSchema = new mongoose.Schema({
    id: String,
    admin_graphql_api_id: String,
    body_html: String,
    created_at: Date,
    handle: String,
    image: Object, // Assuming image can be an object with more details
    images: [Object], // Array of image objects
    options: [optionSchema],
    product_type: String,
    published_at: Date,
    published_scope: String,
    status: String,
    tags: String,
    template_suffix: String,
    title: String,
    updated_at: Date,
    variants: [variantSchema],
    vendor: String,
});

const shopifyProducts = mongoose.model('shopifyProducts', shopifyProductSchema);

module.exports = shopifyProducts;
