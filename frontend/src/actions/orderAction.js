import { adminOrderFail, adminOrderRequest, adminOrderSuccess, createOrderFail, createOrderRequest, createOrderSuccess, deleteOrderFail, deleteOrderRequest, deleteOrderSuccess, orderDetailFail, orderDetailRequest, orderDetailSuccess, updateOrderFail, updateOrderRequest, updateOrderSuccess, userOrderFail, userOrderRequest, userOrderSuccess } from "../slices/orderSlice"
import axios from 'axios'

export const createOrder = order => async(dispatch)=>{
    try{
        dispatch(createOrderRequest())
        const {data}=await axios.post(`/api/v1/order/new`,order)
        dispatch(createOrderSuccess(data))
    }catch(error){
        dispatch(createOrderFail(error.response.data.message))
    }
}

export const userOrders = d => async(dispatch)=>{
    try{
        dispatch(userOrderRequest())
        const {data}=await axios.get(`/api/v1/myorders`)
        dispatch(userOrderSuccess(data))
    }catch(error){
        dispatch(userOrderFail(error.response.data.message))
    }
}

export const OrderDetail = id => async(dispatch)=>{
    try{
        dispatch(orderDetailRequest())
        const {data}=await axios.get(`/api/v1/order/${id}`)
        dispatch(orderDetailSuccess(data))
    }catch(error){
        dispatch(orderDetailFail(error.response.data.message))
    }
}

export const adminOrders = isFinited => async(dispatch)=>{
    try{
        
        dispatch(adminOrderRequest())
        const {data}=await axios.get(`/api/v1/admin/orders`)
        console.log(data)
        dispatch(adminOrderSuccess(data))
    }catch(error){
        dispatch(adminOrderFail(error.response.data.message))
    }
}

export const deleteOrders = id => async(dispatch)=>{
    try{
        dispatch(deleteOrderRequest())
        const {data}=await axios.delete(`/api/v1/admin/order/${id}`)
        dispatch(deleteOrderSuccess(data))
    }catch(error){
        dispatch(deleteOrderFail(error.response.data.message))
    }
}

export const updateOrders = (id,orderData) => async(dispatch)=>{
    try{
        dispatch(updateOrderRequest())
        const {data}=await axios.put(`/api/v1/admin/order/${id}`,orderData)
        dispatch(updateOrderSuccess(data))
    }catch(error){
        dispatch(updateOrderFail(error.response.data.message))
    }
}