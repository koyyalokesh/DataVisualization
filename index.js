const express = require('express')
const app = express()
const port = 4000
const mongoose = require('mongoose');
const mongooseLong = require('mongoose-long');
const cors = require('cors')
mongooseLong(mongoose);
const Long = mongoose.Schema.Types.Long;
const shopifyProducts = require('./Models/ShopifyProducts');
const shopifyCustomers = require('./Models/ShopifyCustomers')
const shopifyOrders = require('./Models/ShopifyOrders');

//middleware
app.use(cors());

// connection code for mongodb
mongoose.connect("mongodb://localhost:27017").then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB', err);
});

//start point
app.get('/',(req,res)=>{
    res.send("hello")
})

// API to get products data

app.get('/products', async(req,res)=>{
    try{
        const products = await shopifyProducts.find({});
        res.json(products);
    }catch(err){
        console.log(err);
        res.send("error fetching products")
    }
});

//Api to get customers data

app.get('/customers', async(req,res)=>{
    try{
        const customers = await shopifyCustomers.find({});
        res.json(customers);
    }catch(err){
        console.log(err);
        res.send("error fetching customers")
    }
})

// api to get orders data

app.get('/orders', async(req,res)=>{
    try{
        const orders = await shopifyOrders.find({})
        res.json(orders);
    }catch(err){
        console.log(err);
        res.send("error fetching orders");
    }
});

//Api to get sales daily
app.get('/totalsales/daily', async (req, res) => {
    try {
        const salesdaily = await shopifyOrders.aggregate([
            {
                $addFields: {
                  createdAtDate: { $toDate: "$created_at" } // Convert 'created_at' to Date
                }
              },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAtDate" },
                        month: { $month: "$createdAtDate" },
                        day: { $dayOfMonth: "$createdAtDate"}
                    },
                    totalSales: { $sum: { $toDouble: "$total_price_set.shop_money.amount" } }
                }
            },
            { 
                $sort: { "_id.year": 1, "_id.month":1, "_id.day":1} 
            }
        ]);
        res.json(salesdaily);
    } catch (error) {
        res.status(500).send("Error fetching total sales" );
        console.log(error)
    }
});

// api to get sales monthly

app.get('/totalsales/monthly', async (req, res) => {
    try {
     const salesMonthly = await shopifyOrders.aggregate([
        {
            $addFields: {
              createdAtDate: { $toDate: "$created_at" } // Convert 'created_at' to Date
            }
          },
      
        {
          $group: {
            _id: {
              year: { $year: "$createdAtDate" },
              month: { $month: "$createdAtDate" }
            },
            totalSales: { $sum: { $toDouble: "$total_price_set.shop_money.amount" } }
          }
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 }
        }
     ]);
      res.json(salesMonthly);
    } catch (error) {
      console.error("Error fetching quarter sales:", error);
      res.status(500).send({ error: "Error fetching total sales" });
    }
  });
// api to get sales for quarterly
app.get('/totalsales/quarterly', async (req, res) => {
    try {
        const salesquarterly = await shopifyOrders.aggregate([
            {
                $addFields: {
                    createdAtDate: { $toDate: "$created_at" } // Convert 'created_at' to Date
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAtDate" }, // Correctly reference createdAtDate with $
                        quarter: {
                            $concat: [
                                "Q", 
                                { $toString: { $ceil: { $divide: [{ $month: "$createdAtDate" }, 3] } } }
                            ]
                        }
                    },
                    totalSales: { $sum: { $toDouble: "$total_price_set.shop_money.amount" } }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.quarter": 1 }
            }
        ]); // Don't forget to call .toArray() to execute the cursor
        res.json(salesquarterly);
    } catch (error) {
        console.error("Error fetching quarterly sales:", error); // Adjusted error message to reflect quarterly
        res.status(500).send({ error: "Error fetching total sales" });
    }
});

//api to get sales yearly

app.get('/totalsales/yearly', async(req,res)=>{
    try{
        const salesyearly = await shopifyOrders.aggregate([
            {
                $addFields: {
                    createdAtDate: { $toDate: "$created_at" } // Convert 'created_at' to Date
                }
            },
            {
                $group: {
                  _id: { year: { $year: "$createdAtDate" } },
                  totalSales: { $sum: { $toDouble: "$total_price_set.shop_money.amount" } }
                }
              },
              {
                $sort: { "_id.year": 1 }
              }

        ]);
        res.json(salesyearly)
    }catch(error){
        console.error("Error fetching yearly sales:", error);
        res.status(500).send({ error: "Error fetching total sales" });

    }
})
//2. sales growth rate
// daily sales growth rate
app.get('/salesgrowth/daily', async (req, res) => {
    try {
        // Aggregate daily sales
        const dailySales = await shopifyOrders.aggregate([
            {
                $addFields: {
                    createdAtDate: { $toDate: "$created_at" }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAtDate" },
                        month: { $month: "$createdAtDate" },
                        day: { $dayOfMonth: "$createdAtDate" }
                    },
                    totalSales: { $sum: { $toDouble: "$total_price_set.shop_money.amount" } }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            }
        ]);

        // Calculate daily growth rate
        let growthRates = [];
        for (let i = 1; i < dailySales.length; i++) {
            let previous = dailySales[i - 1];
            let current = dailySales[i];

            // Ensure consecutive days
            if (
                (previous._id.year === current._id.year &&
                previous._id.month === current._id.month &&
                previous._id.day === current._id.day - 1) ||
                (previous._id.year === current._id.year &&
                previous._id.month === current._id.month - 1 &&
                previous._id.day === 31 && current._id.day === 1)
            ) {
                const growthRate = ((current.totalSales - previous.totalSales) / previous.totalSales) * 100;
                growthRates.push({
                    date: `${current._id.year}-${String(current._id.month).padStart(2, '0')}-${String(current._id.day).padStart(2, '0')}`,
                    growthRate: growthRate
                });
            }
        }

        res.json(growthRates);
    } catch (error) {
        console.error("Error calculating daily sales growth rate:", error);
        res.status(500).send({ error: "Error calculating daily sales growth rate" });
    }
});

//Monthly Sales Growth Rate Over Time
app.get('/salesgrowth/monthly', async (req, res) => {
    try {
        // Aggregate monthly sales
        const monthlySales = await shopifyOrders.aggregate([
            {
                $addFields: {
                    createdAtDate: { $toDate: "$created_at" }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAtDate" },
                        month: { $month: "$createdAtDate" }
                    },
                    totalSales: { $sum: { $toDouble: "$total_price_set.shop_money.amount" } }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        // Calculate monthly growth rate
        let growthRates = [];
        for (let i = 1; i < monthlySales.length; i++) {
            let previous = monthlySales[i - 1];
            let current = monthlySales[i];

            // Ensure consecutive months
            if (
                (previous._id.year === current._id.year &&
                previous._id.month === current._id.month - 1) ||
                (previous._id.year === current._id.year - 1 &&
                previous._id.month === 12 && current._id.month === 1)
            ) {
                const growthRate = ((current.totalSales - previous.totalSales) / previous.totalSales) * 100;
                growthRates.push({
                    period: `${current._id.year}-${String(current._id.month).padStart(2, '0')}`,
                    growthRate: growthRate
                });
            }
        }

        res.json(growthRates);
    } catch (error) {
        console.error("Error calculating monthly sales growth rate:", error);
        res.status(500).send({ error: "Error calculating monthly sales growth rate" });
    }
});

//quarterly sales growth rate
app.get('/salesgrowth/quarterly', async (req, res) => {
    try {
        // Aggregate quarterly sales
        const quarterlySales = await shopifyOrders.aggregate([
            {
                $addFields: {
                    createdAtDate: { $toDate: "$created_at" }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAtDate" },
                        quarter: {
                            $concat: [
                                "Q", 
                                { $toString: { $ceil: { $divide: [{ $month: "$createdAtDate" }, 3] } } }
                            ]
                        }
                    },
                    totalSales: { $sum: { $toDouble: "$total_price_set.shop_money.amount" } }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.quarter": 1 }
            }
        ]);

        // Calculate quarterly growth rate
        let growthRates = [];
        for (let i = 1; i < quarterlySales.length; i++) {
            let previous = quarterlySales[i - 1];
            let current = quarterlySales[i];

            // Ensure consecutive quarters
            if (
                (previous._id.year === current._id.year &&
                previous._id.quarter === `Q${(parseInt(current._id.quarter.replace('Q', '')) - 1)}`) ||
                (previous._id.year === current._id.year - 1 &&
                previous._id.quarter === "Q4" && current._id.quarter === "Q1")
            ) {
                const growthRate = ((current.totalSales - previous.totalSales) / previous.totalSales) * 100;
                growthRates.push({
                    period: `${current._id.year}-${current._id.quarter}`,
                    growthRate: growthRate
                });
            }
        }

        res.json(growthRates);
    } catch (error) {
        console.error("Error calculating quarterly sales growth rate:", error);
        res.status(500).send({ error: "Error calculating quarterly sales growth rate" });
    }
});

//yearly sales growth rate
app.get('/salesgrowth/yearly', async (req, res) => {
    try {
        // Aggregate yearly sales
        const yearlySales = await shopifyOrders.aggregate([
            {
                $addFields: {
                    createdAtDate: { $toDate: "$created_at" }
                }
            },
            {
                $group: {
                    _id: { year: { $year: "$createdAtDate" } },
                    totalSales: { $sum: { $toDouble: "$total_price_set.shop_money.amount" } }
                }
            },
            {
                $sort: { "_id.year": 1 }
            }
        ]);

        // Calculate yearly growth rate
        let growthRates = [];
        for (let i = 1; i < yearlySales.length; i++) {
            let previous = yearlySales[i - 1];
            let current = yearlySales[i];

            // Ensure consecutive years
            if (previous._id.year === current._id.year - 1) {
                const growthRate = ((current.totalSales - previous.totalSales) / previous.totalSales) * 100;
                growthRates.push({
                    year: current._id.year,
                    growthRate: growthRate
                });
            }
        }

        res.json(growthRates);
    } catch (error) {
        console.error("Error calculating yearly sales growth rate:", error);
        res.status(500).send({ error: "Error calculating yearly sales growth rate" });
    }
});




//3. New Customers Added Over Time:
// Daily New Customers
app.get('/newcustomers/daily', async (req, res) => {
    try {
        const dailyNewCustomers = await shopifyCustomers.aggregate([
            {
                $addFields: {
                    createdAtDate: { $toDate: "$created_at" }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAtDate" },
                        month: { $month: "$createdAtDate" },
                        day: { $dayOfMonth: "$createdAtDate" }
                    },
                    newCustomersCount: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            }
        ]);
        res.json(dailyNewCustomers);
    } catch (error) {
        console.error("Error fetching daily new customers:", error);
        res.status(500).send({ error: "Error fetching new customers data" });
    }
});

//monthly new customers
app.get('/newcustomers/monthly', async (req, res) => {
    try {
        const monthlyNewCustomers = await shopifyCustomers.aggregate([
            {
                $addFields: {
                    createdAtDate: { $toDate: "$created_at" }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAtDate" },
                        month: { $month: "$createdAtDate" }
                    },
                    newCustomersCount: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);
        res.json(monthlyNewCustomers);
    } catch (error) {
        console.error("Error fetching monthly new customers:", error);
        res.status(500).send({ error: "Error fetching new customers data" });
    }
});

// quarterly new customers
app.get('/newcustomers/quarterly', async (req, res) => {
    try {
        const quarterlyNewCustomers = await shopifyCustomers.aggregate([
            {
                $addFields: {
                    createdAtDate: { $toDate: "$created_at" }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAtDate" },
                        quarter: {
                            $concat: [
                                "Q",
                                { $toString: { $ceil: { $divide: [{ $month: "$createdAtDate" }, 3] } } }
                            ]
                        }
                    },
                    newCustomersCount: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.quarter": 1 }
            }
        ]);
        res.json(quarterlyNewCustomers);
    } catch (error) {
        console.error("Error fetching quarterly new customers:", error);
        res.status(500).send({ error: "Error fetching new customers data" });
    }
});

//yearly new customers
app.get('/newcustomers/yearly', async (req, res) => {
    try {
        const yearlyNewCustomers = await shopifyCustomers.aggregate([
            {
                $addFields: {
                    createdAtDate: { $toDate: "$created_at" }
                }
            },
            {
                $group: {
                    _id: { year: { $year: "$createdAtDate" } },
                    newCustomersCount: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1 }
            }
        ]);
        res.json(yearlyNewCustomers);
    } catch (error) {
        console.error("Error fetching yearly new customers:", error);
        res.status(500).send({ error: "Error fetching new customers data" });
    }
});

//4.Number of Repeat Customers:
//Daily Repeat Customers
app.get('/repeat-customers/daily', async (req, res) => {
    try {
        const repeatCustomersDaily = await shopifyOrders.aggregate([
            {
                $addFields: {
                    createdAtDate: { $toDate: "$created_at" }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAtDate" },
                        month: { $month: "$createdAtDate" },
                        day: { $dayOfMonth: "$createdAtDate" },
                        customerId: "$customer_id"
                    },
                    purchaseCount: { $sum: 1 }
                }
            },
            {
                $match: {
                    purchaseCount: { $gt: 1 }
                }
            },
            {
                $group: {
                    _id: {
                        year: "$_id.year",
                        month: "$_id.month",
                        day: "$_id.day"
                    },
                    repeatCustomersCount: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            }
        ]);

        res.json(repeatCustomersDaily);
    } catch (error) {
        console.error("Error fetching daily repeat customers:", error);
        res.status(500).send({ error: "Error fetching daily repeat customers" });
    }
});


//monthly repaeated customers
app.get('/repeat-customers/monthly', async (req, res) => {
    try {
        const repeatCustomersMonthly = await shopifyOrders.aggregate([
            {
                $addFields: {
                    createdAtDate: { $toDate: "$created_at" }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAtDate" },
                        month: { $month: "$createdAtDate" },
                        customerId: "$customer.id"
                    },
                    purchaseCount: { $sum: 1 }
                }
            },
            {
                $match: {
                    purchaseCount: { $gt: 1 }
                }
            },
            {
                $group: {
                    _id: {
                        year: "$_id.year",
                        month: "$_id.month"
                    },
                    repeatCustomersCount: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        res.json(repeatCustomersMonthly);
    } catch (error) {
        console.error("Error fetching monthly repeat customers:", error);
        res.status(500).send({ error: "Error fetching monthly repeat customers" });
    }
});

//quarterlty repeated customers
app.get('/repeat-customers/quarterly', async (req, res) => {
    try {
        const repeatCustomersQuarterly = await shopifyOrders.aggregate([
            {
                $addFields: {
                    createdAtDate: { $toDate: "$created_at" }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAtDate" },
                        quarter: {
                            $concat: [
                                "Q",
                                { $toString: { $ceil: { $divide: [{ $month: "$createdAtDate" }, 3] } } }
                            ]
                        },
                        customerId: "$customer.id"
                    },
                    purchaseCount: { $sum: 1 }
                }
            },
            {
                $match: {
                    purchaseCount: { $gt: 1 }
                }
            },
            {
                $group: {
                    _id: {
                        year: "$_id.year",
                        quarter: "$_id.quarter"
                    },
                    repeatCustomersCount: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.quarter": 1 }
            }
        ]);

        res.json(repeatCustomersQuarterly);
    } catch (error) {
        console.error("Error fetching quarterly repeat customers:", error);
        res.status(500).send({ error: "Error fetching quarterly repeat customers" });
    }
});


//yearly repeated customers
app.get('/repeat-customers/yearly', async (req, res) => {
    try {
        const repeatCustomersYearly = await shopifyOrders.aggregate([
            {
                $addFields: {
                    createdAtDate: { $toDate: "$created_at" }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAtDate" },
                        customerId: "$customer.id"
                    },
                    purchaseCount: { $sum: 1 }
                }
            },
            {
                $match: {
                    purchaseCount: { $gt: 1 }
                }
            },
            {
                $group: {
                    _id: {
                        year: "$_id.year"
                    },
                    repeatCustomersCount: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1 }
            }
        ]);

        res.json(repeatCustomersYearly);
    } catch (error) {
        console.error("Error fetching yearly repeat customers:", error);
        res.status(500).send({ error: "Error fetching yearly repeat customers" });
    }
});

// 5.geographical city
app.get('/customerdistribution', async (req, res) => {
    try {
        const cityDistribution = await shopifyCustomers.aggregate([
            {
                $match: { 'default_address.city': { $exists: true, $ne: null } }
            },
            {
                $group: {
                    _id: "$default_address.city",
                    count: { $sum: 1 } // Count the number of customers per city
                }
            },
            {
                $sort: { count: -1 } // Optional: sort cities by count in descending order
            }
        ]);

        res.json(cityDistribution);
    } catch (error) {
        console.error("Error fetching customer distribution:", error);
        res.status(500).send({ error: "Error fetching customer distribution" });
    }
});


//6.Customer Lifetime Value by Cohorts:

app.get('/clv-by-cohort', async (req, res) => {
    try {
        

        // Fetch first purchase month for each customer
        const customerCohorts = await shopifyCustomers.aggregate([
            {
                $lookup: {
                    from: 'shopifyOrders',
                    localField: 'id',
                    foreignField: 'customer.id',
                    as: 'orders'
                }
            },
            {
                $addFields: {
                    firstPurchaseDate: {
                        $min: {
                            $map: {
                                input: "$orders",
                                as: "order",
                                in: { $dateFromString: { dateString: "$$order.created_at" } } // Convert string to Date
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    cohortMonth: {
                        $dateToString: { format: "%Y-%m", date: "$firstPurchaseDate" } // Format date to "YYYY-MM"
                    }
                }
            },
            {
                $group: {
                    _id: "$cohortMonth", // Group by cohort month
                    customers: { $push: "$id" } // Collect customer IDs in each cohort
                }
            }
        ]);

        // Calculate CLV for each cohort
        const clvByCohort = await shopifyOrders.aggregate([
            {
                $addFields: {
                    createdAtDate: { $dateFromString: { dateString: "$created_at" } } // Convert 'created_at' to Date
                }
            },
            {
                $match: {
                    'customer.id': { $in: customerCohorts.flatMap(c => c.customers) } // Match orders for the customers in the cohorts
                }
            },
            {
                $group: {
                    _id: {
                        cohortMonth: {
                            $dateToString: { format: "%Y-%m", date: "$createdAtDate" }
                        }
                    },
                    totalRevenue: { $sum: { $toDouble: "$total_price" } } // Ensure total_price is a number
                }
            },
            {
                $sort: { "_id.cohortMonth": 1 } // Sort by cohort month
            }
        ]);

        res.json(clvByCohort);
    } catch (error) {
        console.error("Error fetching CLV by cohort:", error);
        res.status(500).send({ error: "Error fetching CLV by cohort" });
    }
});



app.listen(port,()=>{
  console.log("server started")
});


