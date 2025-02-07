import axios from "axios";
import order from "../models/order.js";
import orderController from "./order.js";

const accessTockenPayload = {
  app_id: "YGzP5Ah1zE9Iob2t1wugWA40lNEx6OUD",
  nonce: "random",
  secret:
    "4c399a1615198a6f208d02db73f5eac6138bca2bd8b8ae7e48d2466d7350ce74aa5f966de09c76c732f2eb8ce023b8df0413a188d26f0001b9e25d283be77de8",
  grant_type: "client_credentials",
};

const transectionPayload = {
  account_name: "dcc",
  type: "SALE",
  channel: "CNP",
  amount: "199",
  currency: "EUR",
  reference: "93459c78-f3f9-427c-84df-ca0584bb55bf",
  country: "DE",
  payment_method: {
    name: "James Mason",
    entry_mode: "ECOM",

    card: {
      number: "4242424242424242",
      expiry_month: "05",
      expiry_year: "25",
      cvv: "852",
      cvv_indicator: "PRESENT",
      avs_address: "Flat 123",
      avs_postal_code: "50001",
    },
  },
};

const transectionHeader = {
  "content-type": "application/json",
  accept: "application/json",
  "x-gp-version": "2021-03-22",
};

const accessTokenGen = async (req, res) => {
  try {
    const response = await axios.post(
      "https://apis.sandbox.globalpay.com/ucp/accesstoken",
      accessTockenPayload,
      {
        headers: transectionHeader,
      }
    );
    if (!response) {
      return res.status(400).json({ message: "Access Token Failed" });
    }
    return response;
  } catch (error) {
    console.error("Error while processing payment by card:", error);

    // Send back a proper error message
    return res.status(500).json({
      message: "An error occurred while processing payment by card",
      error: error.message || "Unknown error",
    });
  }
};

// const payByCard = async (req, res) =>{

//     try {
//         const orderDetails = req.body.orderDetails
//         const cardDetails = req.body.cardDetails

//         if(!orderDetails || !cardDetails){
//             return res.status(400).json({message: "All Fields are required"})
//         }

//         console.log(orderDetails, "\n",cardDetails)
//         const responseData = await accessTokenGen()
//         const {data} = responseData

//         if(!data.token){
//             return res.status(400).json({message: "Token Not Found"})
//         }
//         const response = await axios.post(
//             `https://apis.sandbox.globalpay.com/ucp/transactions`,
//             {
//                 "account_name": `${data.scope.accounts[0].name}`,
//                 "type": "SALE",
//                 "channel": "CNP",
//                 "amount": Math.ceil(orderDetails?.totalPrice)?.toString(),
//                 "currency": 'USD',
//                 "reference": "93459c78-f3f9-427c-84df-ca0584bb55bf",
//                 "country": "CA",
//                 "payment_method": {
//                     "name": `${orderDetails?.name ?? 'shehzad'}`,
//                     "entry_mode": "ECOM",

//                     "card": {
//                         "number": `${cardDetails?.cardNumber}`,
//                         "expiry_month": `${cardDetails?.cardExpiryMonth}`,
//                         "expiry_year": `${cardDetails?.cardExpiryYear}`,
//                         "cvv": `${cardDetails?.cardCvv}`,
//                         "cvv_indicator": "PRESENT",
//                         "avs_address": `${cardDetails?.avsAddress || 'Demo 123'}`,
//                         "avs_postal_code": `${cardDetails?.avsPostalCode || '511234'}`
//                     }
//                 }
//             },
//             {
//                 headers: {
//                     ...transectionHeader,
//                     'Authorization': `Bearer ${data?.token}`,
//                 }
//             }

//         )
//         if (response.data?.action?.result_code.toLowerCase() !== 'success') {
//             return res.status(400).json({
//                 message: "Transaction failed",
//                 details: response.data
//             });
//         }

//         if(response?.data?.action?.result_code.toLowerCase() === 'success'){
//             // console.log(req.body.orderDetails, " aaa")
//             try {
//                 return await orderController.store({...req , body:{...req?.body?.orderDetails}},res)
//             } catch (error) {
//                 console.log(error)
//                 return res.status(400).json({message: "Payment Not successfull"})
//             }
//         }
//          return res.status(200).json({
//             message: "Pay by card done",
//             accessToken: responseData?.data,
//             transectionData: response?.data
//         });
//     } catch (error) {
//         console.log(error)
//         return res.status(400).json({message: "Unhandled Error: Payment Failed " ,error: error.message})
//     }
// }

// const payByCard = async (req, res) => {
//     try {
//         const orderDetails = req.body.orderDetails;
//         const cardDetails = req.body.cardDetails;

//         if (orderDetails.cod === undefined || typeof orderDetails.cod !== 'boolean') {
//             return res.status(200).json({
//                 status: 400,
//                 message: "COD field is required and must be a boolean",
//                 data: {}
//             })
//         }

//         if(orderDetails.cod === false){
//             if (!orderDetails || !cardDetails) {
//                 return  res.status(200).json({
//                     status: 400,
//                     message: "All Fields are required" ,
//                     data: {}
//                 });
//             }

//             console.log("Order Details:", orderDetails, "\nCard Details:", cardDetails);

//             // Generate access token
//             const responseData = await accessTokenGen();
//             const { data } = responseData;

//             if (!data.token) {
//                 return res.status(200).json({
//                     status: 400,
//                     message: "Token Not Found",
//                     data: {}
//                 });
//             }

//             // Make the transaction request
//             let response;
//             try {
//                 const responseapi = await axios.post(
//                     `https://apis.sandbox.globalpay.com/ucp/transactions`,
//                     {
//                         "account_name": `${data.scope.accounts[0].name}`,
//                         "type": "SALE",
//                         "channel": "CNP",
//                         "amount": Math.ceil(orderDetails?.totalPrice)?.toString(),
//                         "currency": 'USD',
//                         "reference": "93459c78-f3f9-427c-84df-ca0584bb55bf",
//                         "country": "CA",
//                         "payment_method": {
//                             "name": `${orderDetails?.name ?? 'shehzad'}`,
//                             "entry_mode": "ECOM",
//                             "card": {
//                                 "number": `${cardDetails?.cardNumber}`,
//                                 "expiry_month": `${cardDetails?.cardExpiryMonth}`,
//                                 "expiry_year": `${cardDetails?.cardExpiryYear}`,
//                                 "cvv": `${cardDetails?.cardCvv}`,
//                                 "cvv_indicator": "PRESENT",
//                                 "avs_address": `${cardDetails?.avsAddress || 'Demo 123'}`,
//                                 "avs_postal_code": `${cardDetails?.avsPostalCode || '511234'}`
//                             }
//                         }
//                     },
//                     {
//                         headers: {
//                             ...transectionHeader,
//                             'Authorization': `Bearer ${data?.token}`,
//                         }
//                     }
//                 );

//                 response = responseapi

//             } catch (apiError) {
//                 // Log and handle detailed API errors
//                 console.error("API Error Details:", apiError.response?.data || apiError.message);
//                 return res.status(200).json({
//                     status: 400,
//                     message: "Payment failed due to invalid request",
//                     error: apiError.response?.data || apiError.message,
//                     data: {}
//                 });
//             }

//                 // Handle successful transaction
//             try {
//                 return await orderController.store({ ...req, body: { ...req?.body?.orderDetails } }, res);
//             } catch (error) {
//                 console.log("Error while storing order:", error);
//                 return res.status(200).json({
//                     status: 400,
//                     message: "Payment Not Successful",
//                     data: {}
//                 });
//             }
//         }else{
//             if(!orderDetails){
//                 return res.status(200).json({
//                     status: 400,
//                     message: "All Fields Are Required",
//                     data: {}
//                 })
//             }
//             return orderController.store({ ...req, body: { ...req?.body?.orderDetails } }, res);
//         }

//     } catch (error) {
//         // Catch block for unexpected errors
//         console.error("Unhandled Error:", error);
//         return res.status(200).json({
//             status: 400,
//             message: "Unhandled Error: Payment Failed",
//             error: error.message,
//             data: {}
//         });
//     }
// };

const payByCard = async (req, res) => {
  try {
    req.body.orderDetails.totalPrice = Math.ceil(
      Number(req.body.orderDetails.totalPrice).toFixed(2) * 100
    );
    const orderDetails = req.body.orderDetails;
    const cardDetails = req.body.cardDetails;

    if (
      orderDetails.cod === undefined ||
      typeof orderDetails.cod !== "boolean"
    ) {
      return res.status(200).json({
        status: 400,
        message: "COD field is required and must be a boolean",
        data: {},
      });
    }

    if (orderDetails.cod === false) {
      if (!orderDetails || !cardDetails) {
        return res.status(200).json({
          status: 400,
          message: "All Fields are required",
          data: {},
        });
      }

      console.log(
        "Order Details:",
        orderDetails,
        "\nCard Details:",
        cardDetails
      );

      // Generate access token
      const responseData = await accessTokenGen();
      const { data } = responseData;

      if (!data.token) {
        return res.status(200).json({
          status: 400,
          message: "Token Not Found",
          data: {},
        });
      }

      // Make the transaction request
      let response;
      try {
        const responseapi = await axios.post(
          `https://apis.sandbox.globalpay.com/ucp/transactions`,
          {
            account_name: `${data.scope.accounts[0].name}`,
            type: "SALE",
            channel: "CNP",
            amount: orderDetails?.totalPrice?.toString(),
            currency: "USD",
            reference: "93459c78-f3f9-427c-84df-ca0584bb55bf",
            country: "CA",
            payment_method: {
              name: `${orderDetails?.name ?? "shehzad"}`,
              entry_mode: "ECOM",
              card: {
                number: `${cardDetails?.cardNumber}`,
                expiry_month: `${cardDetails?.cardExpiryMonth}`,
                expiry_year: `${cardDetails?.cardExpiryYear}`,
                cvv: `${cardDetails?.cardCvv}`,
                cvv_indicator: "PRESENT",
                avs_address: `${cardDetails?.avsAddress || "Demo 123"}`,
                avs_postal_code: `${cardDetails?.avsPostalCode || "511234"}`,
              },
            },
          },
          {
            headers: {
              ...transectionHeader,
              Authorization: `Bearer ${data?.token}`,
            },
          }
        );

        response = responseapi;
      } catch (apiError) {
        // Log and handle detailed API errors
        console.error(
          "API Error Details:",
          apiError.response?.data || apiError.message
        );
        return res.status(200).json({
          status: 400,
          message: "Payment failed due to invalid request",
          error: apiError.response?.data || apiError.message,
          data: {},
        });
      }

      // Handle successful transaction
      try {
        const totalPrice = req.body.orderDetails.totalPrice / 100;
        return await orderController.store(
          { ...req, body: { ...req?.body?.orderDetails, totalPrice } },
          res
        );
      } catch (error) {
        console.log("Error while storing order:", error);
        return res.status(200).json({
          status: 400,
          message: "Payment Not Successful",
          data: {},
        });
      }
    } else {
      if (!orderDetails) {
        return res.status(200).json({
          status: 400,
          message: "All Fields Are Required",
          data: {},
        });
      }
      const totalPrice = req.body.orderDetails.totalPrice / 100;
      return orderController.store(
        { ...req, body: { ...req?.body?.orderDetails, totalPrice } },
        res
      );
    }
  } catch (error) {
    // Catch block for unexpected errors
    console.error("Unhandled Error:", error);
    return res.status(200).json({
      status: 400,
      message: "Unhandled Error: Payment Failed",
      error: error.message,
      data: {},
    });
  }
};
export { payByCard };
