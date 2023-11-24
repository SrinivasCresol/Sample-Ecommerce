const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_KEY);
const Order = require("../Models/OrdersModel");
const nodemailer = require("nodemailer");

if (!stripe) {
  console.error("Stripe secret key not provided in environment variables.");
  process.exit(1);
}

//Payment Controller

exports.makePayment = async (req, res) => {
  const cartMetadata = req.body.cart.map((item) => ({
    id: item._id,
    model: item.model,
    cartQuantity: item.cartQuantity,
  }));

  const customer = await stripe.customers.create({
    metadata: {
      userId: req.body.userid,
      cart: JSON.stringify(cartMetadata),
    },
  });

  try {
    const line_items = req.body.cart.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.model,
          images: [item.imageUrl],
          metadata: {
            id: item._id,
          },
        },
        unit_amount: item.sale_price ? item.sale_price * 100 : item.price * 100,
      },
      quantity: item.cartQuantity,
      adjustable_quantity: {
        enabled: true,
        minimum: 1,
      },
    }));

    const params = {
      submit_type: "pay",
      line_items,
      metadata: {
        userId: req.body.userid,
      },
      mode: "payment",
      payment_method_types: ["card"],
      shipping_address_collection: { allowed_countries: ["IN"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 0,
              currency: "inr",
            },
            display_name: "Free Shipping",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 4,
              },
              maximum: {
                unit: "business_day",
                value: 5,
              },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 6000,
              currency: "inr",
            },
            display_name: "For Faster Delivery",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 1,
              },
              maximum: {
                unit: "business_day",
                value: 1,
              },
            },
          },
        },
      ],
      phone_number_collection: {
        enabled: true,
      },
      customer: customer.id,
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
    };

    const session = await stripe.checkout.sessions.create({ ...params });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.log(error);
    res.status(500).json(
      {
        message: "An error occurred while creating the checkout session",
      },
      error
    );
  }
};

//Web Hook API

const endpointSecret = process.env.WEBHOOK_SECRET;

exports.handleEvents = async (req, res) => {
  const payload = req.body;
  const payloadString = JSON.stringify(payload, null, 2);
  const header = stripe.webhooks.generateTestHeaderString({
    payload: payloadString,
    secret: endpointSecret,
  });

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      payloadString,
      header,
      endpointSecret
    );
  } catch (err) {
    console.log(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  switch (event.type) {
    case "customer.created":
      const customerCreated = event.data.object;
      const createCustomerId = customerCreated.id;
      const Items = JSON.parse(customerCreated.metadata.cart);
      const userId = customerCreated.metadata.userId;

      const products = Items.map((item) => {
        return {
          productId: item.id,
          model: item.model,
          quantity: item.cartQuantity,
        };
      });

      try {
        const order = new Order({
          userID: userId,
          customerId: createCustomerId,
          products,
        });
        await order.save();
      } catch (error) {
        console.error("Error Creating Order:", error);
      }

      break;

    case "customer.updated":
      const customerUpdated = event.data.object;

      break;

    case "payment_intent.requires_action":
      const paymentIntentAction = event.data.object;
      const paymentIntentActionId = paymentIntentAction.id;

      break;

    case "payment_intent.created":
      const paymentIntentCreate = event.data.object;
      const createPaymentId = paymentIntentCreate.id;
      const createClientSecret = paymentIntentCreate.client_secret;
      const amount = paymentIntentCreate.amount / 100;
      const customerID = paymentIntentCreate.customer;

      try {
        const updateOrderProcess = await Order.findOneAndUpdate(
          {
            customerId: customerID,
          },
          {
            $set: {
              paymentID: createPaymentId,
              clientSecret: createClientSecret,
              totalAmount: amount,
              paymentMethodTypes: paymentIntentCreate.payment_method_types,
              paymentStatus: "Payment Initiated! In Progress",
            },
          },
          { new: true }
        );

        if (updateOrderProcess) {
          console.log("Payment Initiated. Order Updated");
        } else {
          console.error("Payment Information not Found or Status not Updated.");
        }
      } catch (error) {
        console.error("Error Checkout Order:", error);
      }

      break;

    case "payment_intent.succeeded":
      const paymentIntentSuccess = event.data.object;

      break;

    case "charge.succeeded":
      const chargeSucceeded = event.data.object;

      try {
        const updatedChargeReceipt = await Order.findOneAndUpdate(
          { paymentID: chargeSucceeded.payment_intent },
          {
            $set: {
              receiptUrl: chargeSucceeded.receipt_url,
            },
          },
          { new: true }
        );

        if (updatedChargeReceipt) {
          console.log("Charge Succeeded. Receipt Updated");
        } else {
          console.error("Payment Details not Found or Status not Updated.");
        }
      } catch (error) {
        console.error("Error Checkout Order:", error);
      }

      break;

    case "checkout.session.completed":
      const checkoutSessionSucceeded = event.data.object;
      const createSessionId = checkoutSessionSucceeded.id;

      try {
        const updatedOrderComplete = await Order.findOneAndUpdate(
          { paymentID: checkoutSessionSucceeded.payment_intent },
          {
            $set: {
              name: checkoutSessionSucceeded.customer_details.name,
              email: checkoutSessionSucceeded.customer_details.email,
              mobileNo: checkoutSessionSucceeded.customer_details.phone,
              sessionId: createSessionId,
              paymentStatus: "Paid",
              billingAddress: {
                line1: checkoutSessionSucceeded.customer_details.address.line1,
                line2: checkoutSessionSucceeded.customer_details.address.line2,
                city: checkoutSessionSucceeded.customer_details.address.city,
                postal_code:
                  checkoutSessionSucceeded.customer_details.address.postal_code,
                state: checkoutSessionSucceeded.customer_details.address.state,
                country:
                  checkoutSessionSucceeded.customer_details.address.country,
              },
              shippingAddress: {
                line1: checkoutSessionSucceeded.shipping_details.address.line1,
                line2: checkoutSessionSucceeded.shipping_details.address.line2,
                city: checkoutSessionSucceeded.shipping_details.address.city,
                postal_code:
                  checkoutSessionSucceeded.shipping_details.address.postal_code,
                state: checkoutSessionSucceeded.shipping_details.address.state,
                country:
                  checkoutSessionSucceeded.shipping_details.address.country,
              },
            },
          },
          { new: true }
        );

        if (updatedOrderComplete) {
          var transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.MAIL,
              pass: process.env.PASS,
            },
          });

          var mailOptions = {
            from: process.env.MAIL,
            to: checkoutSessionSucceeded.customer_details.email,
            subject: "Order Placed",
            text: `Congratulations ${checkoutSessionSucceeded.customer_details.name}! Your Orders has successfully placed.`,
          };

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.error(error);
              return res.status(500).json({ message: "Failed to send email" });
            } else {
              return res
                .status(200)
                .json({ Status: "Successfully Send Mail to the Customer" });
            }
          });
          console.log("Payment Succeeded. Order Status Updated");
        } else {
          console.error("Payment Details not Found or Status not Updated.");
        }
      } catch (error) {
        console.error("Error Checkout Order:", error);
      }

      break;

    case "charge.failed":
      const chargeFailed = event.data.object;

      break;

    case "payment_intent.payment_failed":
      const paymentIntentFailed = event.data.object;
      const failedPaymentId = paymentIntentFailed.id;

      try {
        const existingOrder = await Order.findOne({
          paymentID: failedPaymentId,
        });

        if (existingOrder) {
          const updatedOrderFail = await Order.findOneAndUpdate(
            { paymentID: failedPaymentId },
            {
              $set: {
                name: paymentIntentFailed.shipping.name,
                email:
                  paymentIntentFailed.last_payment_error.payment_method
                    .billing_details.email,
                paymentStatus: `Transaction Failed due to ${paymentIntentFailed.last_payment_error.message}`,
                paymentDetails: {
                  code: paymentIntentFailed.last_payment_error.code,
                  declinedCode:
                    paymentIntentFailed.last_payment_error.decline_code,
                  message: paymentIntentFailed.last_payment_error.message,
                },
                billingAddress: {
                  line1:
                    paymentIntentFailed.last_payment_error.payment_method
                      .billing_details.address.line1,
                  line2:
                    paymentIntentFailed.last_payment_error.payment_method
                      .billing_details.address.line2,
                  city: paymentIntentFailed.last_payment_error.payment_method
                    .billing_details.address.city,
                  postal_code:
                    paymentIntentFailed.last_payment_error.payment_method
                      .billing_details.address.postal_code,
                  state:
                    paymentIntentFailed.last_payment_error.payment_method
                      .billing_details.address.state,
                  country:
                    paymentIntentFailed.last_payment_error.payment_method
                      .billing_details.address.country,
                },
                shippingAddress: {
                  line1: paymentIntentFailed.shipping.address.line1,
                  line2: paymentIntentFailed.shipping.address.line2,
                  city: paymentIntentFailed.shipping.address.city,
                  postal_code: paymentIntentFailed.shipping.address.postal_code,
                  state: paymentIntentFailed.shipping.address.state,
                  country: paymentIntentFailed.shipping.address.country,
                },
              },
            },
            { new: true }
          );

          if (updatedOrderFail) {
            var transporter = nodemailer.createTransport({
              service: "gmail",
              auth: {
                user: process.env.MAIL,
                pass: process.env.PASS,
              },
            });

            var mailOptions = {
              from: process.env.MAIL,
              to: paymentIntentFailed.last_payment_error.payment_method
                .billing_details.email,
              subject: "Order Failed",
              text: `Dear ${paymentIntentFailed.shipping.name}! Your Transaction has been cancelled due to ${paymentIntentFailed.last_payment_error.message}.`,
            };

            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.error(error);
                return res
                  .status(500)
                  .json({ message: "Failed to send email" });
              } else {
                return res
                  .status(200)
                  .json({ Status: "Successfully Send Mail to the Customer" });
              }
            });
            console.log("Payment Failed! and Status Updated.");
          } else {
            console.error("PaymentID not found or Status not Updated.");
          }
        }
      } catch (error) {
        console.error("Error Checkout Order:", error);
      }

      break;

    case "checkout.session.expired":
      const checkoutSessionExpired = event.data.object;
      const getPaymentID = checkoutSessionExpired.payment_intent;

      try {
        const updatedOrderFail = await Order.findOneAndUpdate(
          { paymentID: getPaymentID },
          {
            $set: {
              name: checkoutSessionExpired.shipping_details.name,
              paymentStatus: "Payment Failed! Session Expired.",
              shippingAddress: {
                line1: checkoutSessionExpired.shipping_details.address.line1,
                line2: checkoutSessionExpired.shipping_details.address.line2,
                city: checkoutSessionExpired.shipping_details.address.city,
                postal_code:
                  checkoutSessionExpired.shipping_details.address.postal_code,
                state: checkoutSessionExpired.shipping_details.address.state,
                country:
                  checkoutSessionExpired.shipping_details.address.country,
              },
            },
          },
          { new: true }
        );

        if (updatedOrderFail) {
          console.log("Payment Session Expired! and Status Updated.");
        } else {
          console.error("PaymentID not found or Status not Updated.");
        }
      } catch (error) {
        console.error("Error Checkout Order:", error);
      }

      break;

    case "payment_intent.canceled":
      const paymentCancelled = event.data.object;
      const getPayId = paymentCancelled.id;

      try {
        const updatedOrderFail = await Order.findOneAndUpdate(
          { paymentID: getPayId },
          {
            $set: {
              name: paymentCancelled.shipping.name,
              paymentStatus: "Payment Failed! Session Expired.",
              cancelledAt: paymentCancelled.canceled_at,
              shippingAddress: {
                line1: paymentCancelled.shipping.address.line1,
                line2: paymentCancelled.shipping.address.line2,
                city: paymentCancelled.shipping.address.city,
                postal_code: paymentCancelled.shipping.address.postal_code,
                state: paymentCancelled.shipping.address.state,
                country: paymentCancelled.shipping.address.country,
              },
            },
          },
          { new: true }
        );

        if (updatedOrderFail) {
          console.log("Payment Cancelled! and Status Updated.");
        } else {
          console.error("PaymentID not found or Status not Updated.");
        }
      } catch (error) {
        console.error("Error Checkout Order:", error);
      }

      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.send();
};
