import Stripe from 'stripe'
const { CreateOrder } = require('./orderService');
const { CreateCheckoutSession, CloseCheckoutSession } = require('../services/checkoutSessionService');
const {GetUserById} = require('../services/userService');

const config = useRuntimeConfig();
const stripe = new Stripe(config.stripe_secret_key);

async function StripeCheckoutSession(user, productsData, successURL, cancelURL) {
    
    //Create internal checkout session that we can use to track the order
    const internalSession = await CreateCheckoutSession(user.id, "stripe")
    
    const line_items = productsData.map((product) => {
        return {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: product.name,
                    description: product.description,
                    images: [product.imageURL],
                    metadata: {
                        product_id: product.id.toString()
                    }
                },
                unit_amount: product.price,
            },
            quantity: product.quantity,
        }
    });

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        metadata: {
            internal_session_id: internalSession.id.toString()
        },
        client_reference_id: user.id,
        customer_email: user.email,
        line_items: line_items,
        mode: 'payment',
        success_url: `${successURL}?session_id=${internalSession.id.toString()}`,
        cancel_url: cancelURL,
        tax_id_collection: {
            enabled: true,
        }
    });
    return session;
}

async function StripeCheckoutComplete(requestBody, signature) {
    let event;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    event = stripe.webhooks.constructEvent(requestBody, signature, webhookSecret);
    if (!event) { throw new Error("Error: Webhook event not constructed"); }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const retrievedSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['line_items', 'line_items.data.price.product']
        });

        const productsData = retrievedSession.line_items.data.map((product) => {
            return {
                product_ID: product.price.product.metadata.product_id,
                quantity: product.quantity,
                unit_Price: product.price.unit_amount,
                name: product.price.product.name
            }
        });

        await CloseCheckoutSession(retrievedSession.metadata.internal_session_id);
        const user = await GetUserById(retrievedSession.client_reference_id);

        if(!user) { throw new Error("User not found from order"); }

        await CreateOrder(
            retrievedSession.client_reference_id,
            user.email,
            productsData,
            retrievedSession.amount_total,
            new Date(),
            "completed",
            "Stripe",
            retrievedSession.id,
            retrievedSession.metadata.internal_session_id,
            ""
        );
    }
}

module.exports = {
    StripeCheckoutSession,
    StripeCheckoutComplete
}