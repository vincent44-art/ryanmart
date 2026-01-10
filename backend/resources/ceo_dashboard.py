from flask_restful import Resource
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from extensions import db
from models.user import User, UserRole
from models.inventory import Inventory
from models.sales import Sale
from models.purchases import Purchase
from models.driver import DriverExpense
from models.other_expense import OtherExpense
from models.seller_fruit import SellerFruit
from utils.helpers import make_response_data

class CEODashboardResource(Resource):
    @jwt_required()
    def get(self):
        # Aggregate stats for CEO overview
        total_users = User.query.count()
        total_inventory_items = Inventory.query.count()
        total_sales = db.session.query(func.sum(Sale.amount)).scalar() or 0
        total_purchases = db.session.query(func.sum(Purchase.cost)).scalar() or 0
        total_car_expenses = db.session.query(func.sum(DriverExpense.amount)).scalar() or 0
        total_other_expenses = db.session.query(func.sum(OtherExpense.amount)).scalar() or 0
        # Sum all user salaries
        total_salaries = db.session.query(func.sum(User.salary)).scalar() or 0
        net_profit = total_sales - (total_purchases + total_car_expenses + total_other_expenses + total_salaries)

        # Calculate profit margin for stats
        profit_margin = (net_profit / total_sales * 100) if total_sales else 0

        # Fruit performance: aggregate for all fruits, including losses
        fruit_performance = []
        fruit_types = db.session.query(Sale.fruit_name).distinct().all()
        total_fruit_profit = 0
        total_fruit_loss = 0
        for fruit_row in fruit_types:
            fruit_type = fruit_row[0]
            purchases = db.session.query(func.sum(Purchase.cost)).filter(Purchase.fruit_type == fruit_type).scalar() or 0
            sales = db.session.query(func.sum(Sale.amount)).filter(Sale.fruit_name == fruit_type).scalar() or 0
            profit = sales - purchases
            profit_margin = (profit / purchases * 100) if purchases else 0
            is_loss = profit < 0
            if is_loss:
                total_fruit_loss += abs(profit)
            else:
                total_fruit_profit += profit
            fruit_performance.append({
                'fruitType': fruit_type,
                'purchases': purchases,
                'sales': sales,
                'profit': profit,
                'profitMargin': profit_margin,
                'isLoss': is_loss
            })
        # Sort by profit descending
        fruit_performance.sort(key=lambda x: x['profit'], reverse=True)

        # Add total profit/loss summary for the company
        company_performance = {
            'totalFruitProfit': total_fruit_profit,
            'totalFruitLoss': total_fruit_loss,
            'netFruitProfit': total_fruit_profit - total_fruit_loss
        }

        # Weekly and monthly fruit performance
        from datetime import datetime, timedelta
        import calendar
        now = datetime.now()
        year = now.year
        weeks_in_year = datetime(year, 12, 28).isocalendar()[1]
        week_data = []
        for week in range(1, weeks_in_year + 1):
            week_start = datetime.strptime(f'{year}-W{week - 1}-1', "%Y-W%W-%w")
            week_end = week_start + timedelta(days=6)
            fruits = db.session.query(Sale.fruit_name).distinct().all()
            fruit_performance_week = []
            for fruit_row in fruits:
                fruit_type = fruit_row[0]
                sales = db.session.query(func.sum(Sale.amount)).filter(
                    Sale.fruit_name == fruit_type,
                    Sale.date >= week_start,
                    Sale.date <= week_end
                ).scalar() or 0
                purchases = db.session.query(func.sum(Purchase.cost)).filter(
                    Purchase.fruit_type == fruit_type,
                    Purchase.purchase_date >= week_start,
                    Purchase.purchase_date <= week_end
                ).scalar() or 0
                car_expenses = db.session.query(func.sum(DriverExpense.amount)).filter(
                    DriverExpense.date >= week_start,
                    DriverExpense.date <= week_end
                ).scalar() or 0
                other_expenses = db.session.query(func.sum(OtherExpense.amount)).filter(
                    OtherExpense.date >= week_start,
                    OtherExpense.date <= week_end
                ).scalar() or 0
                profit = sales - (purchases + car_expenses + other_expenses)
                profit_margin = (profit / purchases * 100) if purchases else 0
                is_loss = profit < 0
                fruit_performance_week.append({
                    'fruitType': fruit_type,
                    'sales': sales,
                    'purchases': purchases,
                    'carExpenses': car_expenses,
                    'otherExpenses': other_expenses,
                    'profit': profit,
                    'profitMargin': profit_margin,
                    'isLoss': is_loss
                })
            # Best and worst performing fruit for the week
            best = max(fruit_performance_week, key=lambda x: x['profit'], default=None)
            worst = min(fruit_performance_week, key=lambda x: x['profit'], default=None)
            week_data.append({
                'week': week,
                'start': week_start.strftime('%Y-%m-%d'),
                'end': week_end.strftime('%Y-%m-%d'),
                'fruits': fruit_performance_week,
                'bestPerformer': best,
                'worstPerformer': worst
            })

        # Monthly summary (all fruits combined)
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        monthly_data = []
        for i, month in enumerate(range(1, 13)):
            sales = db.session.query(func.sum(Sale.amount)).filter(func.extract('month', Sale.date) == month).scalar()
            purchases = db.session.query(func.sum(Purchase.cost)).filter(func.extract('month', Purchase.purchase_date) == month).scalar()
            car_expenses = db.session.query(func.sum(DriverExpense.amount)).filter(func.extract('month', DriverExpense.date) == month).scalar()
            other_expenses = db.session.query(func.sum(OtherExpense.amount)).filter(func.extract('month', OtherExpense.date) == month).scalar()
            salaries = db.session.query(func.sum(User.salary)).scalar()  # Assuming salaries are monthly
            profit = (sales or 0) - ((purchases or 0) + (car_expenses or 0) + (other_expenses or 0) + (salaries or 0))
            monthly_data.append({
                'month': month_names[i],
                'sales': float(sales) if sales is not None else 0.0,
                'purchases': float(purchases) if purchases is not None else 0.0,
                'expenses': float((car_expenses if car_expenses is not None else 0.0) + (other_expenses if other_expenses is not None else 0.0)),
                'salaries': float(salaries) if salaries is not None else 0.0,
                'profitOrLoss': profit
            })

        # Fetch all seller fruits for CEO view
        seller_fruits = SellerFruit.query.all()
        seller_fruits_data = [fruit.to_dict() for fruit in seller_fruits]

        stats = {
            'totalUsers': total_users,
            'totalInventoryItems': total_inventory_items,
            'totalSales': total_sales,
            'totalPurchases': total_purchases,
            'totalCarExpenses': total_car_expenses,
            'totalOtherExpenses': total_other_expenses,
            'totalSalaries': total_salaries,
            'netProfit': net_profit,
            'profitMargin': profit_margin
        }

        return make_response_data(data={
            'stats': stats,
            'fruitPerformance': fruit_performance,
            'monthlyData': monthly_data,
            'weeklyData': week_data,
            'companyPerformance': company_performance,
            'sellerFruits': seller_fruits_data
        }, message='CEO dashboard overview fetched.')
