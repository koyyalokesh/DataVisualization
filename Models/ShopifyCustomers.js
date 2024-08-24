const mongoose = require('mongoose');
const mongooseLong = require('mongoose-long');
mongooseLong(mongoose);

const Long = mongoose.Schema.Types.Long;

// Define the schema with Long type
const shopifyCustomerSchema = new mongoose.Schema({
    _id: Long,
    addresses: [{
        id: Long,
        customer_id: Long,
        first_name: String,
        last_name: String,
        company: String,
        address1: String,
        address2: String,
        city: String,
        province: String,
        country: String,
        zip: String,
        phone: String,
        name: String,
        province_code: String,
        country_code: String,
        country_name: String,
        default: Boolean
    }],
    admin_graphql_api_id: String,
    created_at: Date,
    currency: String,
    default_address: {
        id: Long,
        customer_id: Long,
        first_name: String,
        last_name: String,
        company: String,
        address1: String,
        address2: String,
        city: String,
        province: String,
        country: String,
        zip: String,
        phone: String,
        name: String,
        province_code: String,
        country_code: String,
        country_name: String,
        default: Boolean
    },
    email: String,
    email_marketing_consent: {
        state: String,
        opt_in_level: String,
        consent_updated_at: Date
    },
    first_name: String,
    id: Long,
    last_name: String,
    last_order_id: Long,
    last_order_name: String,
    multipass_identifier: String,
    note: String,
    orders_count: Number,
    phone: String,
    sms_marketing_consent: String,
    state: String,
    tags: String,
    tax_exempt: Boolean,
    tax_exemptions: [String],
    total_spent: String,
    updated_at: Date,
    verified_email: Boolean
}, {
    collection: 'shopifyCustomers'
});

const shopifyCustomers = mongoose.model('shopifyCustomers', shopifyCustomerSchema);

module.exports = shopifyCustomers;
