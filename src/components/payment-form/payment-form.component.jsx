import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useSelector } from "react-redux";
import { selectCartTotal } from "../../store/cart/cart.selector";
import { selectCurrentUser } from "../../store/user/user.selector";
import { BUTTON_TYPE_CLASSES } from "../button/button.component";

import { PaymentFormContainer, FormContainer, PaymentButton } from "./payment-form.styles";


const PaymentForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const amount = useSelector(selectCartTotal);
    const currentUser = useSelector(selectCurrentUser);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);


    const paymentHandler = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessingPayment(true);

        const response = await fetch('/.netlify/functions/create-payment-intent', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: amount * 100,
                //Need to configure below code if card is not from India.
                description: 'Software development services',
                shipping: {
                    name: 'Vikas Kapse',
                    address: {
                        line1: '510 Townsend St',
                        postal_code: '24242',
                        city: 'San Francisco',
                        state: 'CA',
                        country: 'US',
                    },
                },
            })
        }).then(res => res.json());

        // const clientSecret = response.paymentIntent.client_secret;

        //We can destrucure above commented code like below one.
        const {
            paymentIntent: { client_secret },
        } = response;

        console.log(currentUser?.displayName);

        //Actual payment gateway from front end side
        const paymentResult = await stripe.confirmCardPayment(client_secret, {
            payment_method: {
                card: elements.getElement(CardElement),
                billing_details: {
                    //name: response.paymentIntent.shipping.name ? response.paymentIntent.shipping.name : 'Guest',
                    // name: 'Vikas Kapse',
                    name: currentUser ? currentUser.displayName : 'Guest'
                }
            }
        });

        setIsProcessingPayment(false);

        if (paymentResult.error) {
            alert(paymentResult.error.message);
            console.log(paymentResult)
        } else {
            if (paymentResult.paymentIntent.status === 'succeeded') {
                alert('Payment Successful');
                console.log('Payment Successful')
            }
        }
    }

    return (
        <PaymentFormContainer>
            <FormContainer onSubmit={paymentHandler}>
                <h2>Credit Card Payment:</h2>
                <CardElement />
                <PaymentButton
                    isLoading={isProcessingPayment}
                    buttonType={BUTTON_TYPE_CLASSES.inverted}
                >
                    Pay Now
                </PaymentButton>
            </FormContainer>
        </PaymentFormContainer>
    )
};

export default PaymentForm;