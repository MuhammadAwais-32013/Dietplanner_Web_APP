import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import json
import os
import numpy as np
from collections import defaultdict

class ChatbotAnalyzer:
    def __init__(self):
        self.sessions_dir = "ChatBot/data/sessions"
        self.exports_dir = "exports"
        
    def load_session_data(self):
        """Load all session data from json files"""
        all_sessions = []
        
        for filename in os.listdir(self.sessions_dir):
            if filename.endswith('.json'):
                with open(os.path.join(self.sessions_dir, filename), 'r') as f:
                    try:
                        session_data = json.load(f)
                        all_sessions.append(session_data)
                    except json.JSONDecodeError:
                        continue
                        
        return all_sessions

    def analyze_response_times(self, sessions):
        """Analyze response times across all sessions"""
        response_times = []
        
        for session in sessions:
            messages = session.get('messages', [])
            for i in range(1, len(messages), 2):  # Skip user messages
                if i < len(messages):
                    try:
                        user_timestamp = datetime.fromisoformat(messages[i-1]['timestamp'])
                        bot_timestamp = datetime.fromisoformat(messages[i]['timestamp'])
                        response_time = (bot_timestamp - user_timestamp).total_seconds()
                        response_times.append(response_time)
                    except (KeyError, ValueError):
                        continue
                        
        return response_times

    def analyze_topic_distribution(self, sessions):
        """Analyze distribution of conversation topics"""
        topics = defaultdict(int)
        
        keywords = {
            'diet plan': 'Diet Planning',
            'calorie': 'Nutrition',
            'weight': 'Weight Management',
            'diabetes': 'Medical Conditions',
            'blood pressure': 'Medical Conditions',
            'exercise': 'Fitness',
            'meal': 'Meal Planning',
            'nutrient': 'Nutrition',
            'protein': 'Nutrition',
            'carb': 'Nutrition',
            'fat': 'Nutrition',
            'vitamin': 'Nutrition'
        }
        
        for session in sessions:
            messages = session.get('messages', [])
            for msg in messages:
                if msg.get('sender') == 'user':
                    content = msg.get('content', '').lower()
                    for keyword, topic in keywords.items():
                        if keyword in content:
                            topics[topic] += 1
                            
        return dict(topics)

    def analyze_source_usage(self, sessions):
        """Analyze how often sources are used in responses"""
        source_counts = []
        
        for session in sessions:
            messages = session.get('messages', [])
            for msg in messages:
                if msg.get('sender') == 'assistant':
                    sources = msg.get('sources', [])
                    source_counts.append(len(sources))
                    
        return source_counts

    def generate_graphs(self):
        """Generate and save analysis graphs"""
        sessions = self.load_session_data()
        
        # Set style to a built-in style
        plt.style.use('bmh')  # Using 'bmh' style which is built into matplotlib
        
        # Create a figure with subplots
        fig = plt.figure(figsize=(15, 10))
        
        # 1. Response Time Distribution
        plt.subplot(2, 2, 1)
        response_times = self.analyze_response_times(sessions)
        sns.histplot(response_times, bins=20)
        plt.title('Response Time Distribution')
        plt.xlabel('Response Time (seconds)')
        plt.ylabel('Frequency')
        
        # 2. Topic Distribution
        plt.subplot(2, 2, 2)
        topics = self.analyze_topic_distribution(sessions)
        plt.pie(topics.values(), labels=topics.keys(), autopct='%1.1f%%')
        plt.title('Conversation Topic Distribution')
        
        # 3. Source Usage Distribution
        plt.subplot(2, 2, 3)
        source_counts = self.analyze_source_usage(sessions)
        sns.boxplot(y=source_counts)
        plt.title('Sources Used per Response')
        plt.ylabel('Number of Sources')
        
        # 4. Cumulative Sessions Over Time
        plt.subplot(2, 2, 4)
        dates = [datetime.fromisoformat(s.get('created_at', '2023-01-01')) 
                for s in sessions if 'created_at' in s]
        dates.sort()
        cumulative_sessions = range(1, len(dates) + 1)
        plt.plot(dates, cumulative_sessions)
        plt.title('Cumulative Chat Sessions')
        plt.xlabel('Date')
        plt.ylabel('Number of Sessions')
        plt.xticks(rotation=45)
        
        # Adjust layout and save
        plt.tight_layout()
        plt.savefig('chatbot_analysis.png', dpi=300, bbox_inches='tight')
        plt.close()

        # Generate additional metrics
        self.generate_metrics_summary(sessions)

    def generate_metrics_summary(self, sessions):
        """Generate and save a summary of key metrics"""
        total_sessions = len(sessions)
        total_messages = sum(len(s.get('messages', [])) for s in sessions)
        avg_messages_per_session = total_messages / total_sessions if total_sessions > 0 else 0
        
        response_times = self.analyze_response_times(sessions)
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        source_counts = self.analyze_source_usage(sessions)
        avg_sources = sum(source_counts) / len(source_counts) if source_counts else 0
        
        metrics = {
            "Total Sessions": total_sessions,
            "Total Messages": total_messages,
            "Average Messages per Session": round(avg_messages_per_session, 2),
            "Average Response Time (seconds)": round(avg_response_time, 2),
            "Average Sources per Response": round(avg_sources, 2)
        }
        
        # Save metrics to JSON
        with open('chatbot_metrics.json', 'w') as f:
            json.dump(metrics, f, indent=2)

if __name__ == "__main__":
    analyzer = ChatbotAnalyzer()
    analyzer.generate_graphs()