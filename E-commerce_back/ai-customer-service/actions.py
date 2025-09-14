# actions.py - Rasa自定义动作
import json
import requests
from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet
import google.generativeai as genai
import os

# 配置Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-pro')

class ActionCheckOrderStatus(Action):
    """查询订单状态"""
    
    def name(self) -> Text:
        return "action_check_order_status"
    
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        order_id = tracker.get_slot("order_id")
        
        if not order_id:
            dispatcher.utter_message(text="请提供您的订单号，我来帮您查询～")
            return []
        
        try:
            # 调用后端API查询订单
            response = requests.get(f"http://localhost:3000/api/orders/{order_id}")
            
            if response.status_code == 200:
                order_data = response.json()
                status_map = {
                    "pending": "待付款",
                    "paid": "已付款，准备发货",
                    "shipped": "已发货",
                    "delivered": "已送达",
                    "cancelled": "已取消"
                }
                
                status = status_map.get(order_data.get('status', ''), '未知状态')
                message = f"您的订单 {order_id} 当前状态：{status}"
                
                if order_data.get('tracking_number'):
                    message += f"\n快递单号：{order_data['tracking_number']}"
                
                dispatcher.utter_message(text=message)
            else:
                dispatcher.utter_message(text="抱歉，未找到该订单信息，请检查订单号是否正确。")
                
        except Exception as e:
            dispatcher.utter_message(text="查询订单时出现问题，请稍后重试或联系人工客服。")
        
        return []

class ActionCheckStock(Action):
    """查询商品库存"""
    
    def name(self) -> Text:
        return "action_check_stock"
    
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # 获取商品信息
        product_color = tracker.get_slot("product_color")
        product_size = tracker.get_slot("product_size")
        
        try:
            # 这里应该调用实际的库存查询API
            # 示例响应
            if product_color and product_size:
                message = f"您询问的{product_color}{product_size}码商品目前有库存，可以正常下单！"
            else:
                message = "请告诉我您需要的商品颜色和尺码，我来帮您查询库存～"
            
            dispatcher.utter_message(text=message)
        except Exception as e:
            dispatcher.utter_message(text="库存查询出现问题，请联系客服确认。")
        
        return []

class ActionHandleReturnRequest(Action):
    """处理退货申请"""
    
    def name(self) -> Text:
        return "action_handle_return_request"
    
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        order_id = tracker.get_slot("order_id")
        
        message = """
退货申请流程：
1. 在个人中心-我的订单中找到要退货的商品
2. 点击"申请退货"按钮
3. 选择退货原因并上传照片
4. 填写退货地址信息
5. 等待客服审核（1-2个工作日）

退货要求：
- 商品需保持原包装完整
- 标签和吊牌不能损坏
- 收到商品7天内申请有效

需要帮助可随时联系人工客服！
        """
        
        dispatcher.utter_message(text=message.strip())
        return []

class ActionHandleComplaint(Action):
    """处理投诉"""
    
    def name(self) -> Text:
        return "action_handle_complaint"
    
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        message = """
很抱歉给您带来不好的体验！
您的投诉我们非常重视，将为您优先处理：

投诉渠道：
1. 客服热线：400-123-4567（优先处理）
2. 在线客服：商品页面客服按钮
3. 邮箱投诉：service@shop.com

我们将在24小时内回复您的投诉，并给出满意的解决方案。
您的意见对我们改善服务非常重要！
        """
        
        dispatcher.utter_message(text=message.strip())
        return []

class ActionFallbackWithGemini(Action):
    """使用Gemini处理未识别的问题"""
    
    def name(self) -> Text:
        return "action_fallback_with_gemini"
    
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        user_message = tracker.latest_message.get('text')
        
        # 构建电商专用提示词
        prompt = f"""
你是一个专业的电商客服助手，只回答与电商购物相关的问题。

电商业务范围：
- 商品咨询（价格、参数、库存、规格）
- 订单服务（状态查询、修改、取消）
- 支付问题（支付方式、支付失败、退款）
- 物流配送（发货时间、运费、配送范围）
- 售后服务（退换货、维修、投诉）
- 会员服务（积分、等级、优惠）

回答要求：
1. 语气友好专业，像真实客服
2. 回答简洁明了，突出重点
3. 如果问题超出电商范围，礼貌引导到相关业务
4. 复杂问题建议联系人工客服
5. 回答长度控制在200字以内

用户问题：{user_message}

请回答：
        """
        
        try:
            response = model.generate_content(prompt)
            ai_reply = response.text
            
            # 确保回复与电商相关
            if any(keyword in user_message.lower() for keyword in 
                   ['订单', '商品', '支付', '退货', '换货', '发货', '物流', '价格', '库存']):
                dispatcher.utter_message(text=ai_reply)
            else:
                dispatcher.utter_message(
                    text="我是专门处理购物相关问题的客服助手。请问您有什么商品、订单或售后问题需要咨询吗？"
                )
                
        except Exception as e:
            dispatcher.utter_message(
                text="抱歉，系统暂时繁忙，请稍后重试或联系人工客服：400-123-4567"
            )
        
        return []

class ActionTransferToHuman(Action):
    """转接人工客服"""
    
    def name(self) -> Text:
        return "action_transfer_to_human"
    
    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        message = """
正在为您转接人工客服...

人工客服联系方式：
📞 客服热线：400-123-4567
🕐 服务时间：9:00-21:00
💬 在线客服：商品页面点击客服图标

工作时间外您也可以留言，我们会优先回复！
        """
        
        dispatcher.utter_message(text=message.strip())
        return []
