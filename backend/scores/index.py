'''
Business: Управление результатами игры "Ограбление банка" - получение и обновление баллов команд
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с результатами команд
'''
import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def calculate_place_points(times: list) -> Dict[int, int]:
    sorted_times = sorted(enumerate(times), key=lambda x: x[1])
    place_points = {100: [], 75: [], 50: [], 25: []}
    points_list = [100, 75, 50, 25]
    
    for idx, (team_idx, _) in enumerate(sorted_times):
        if idx < len(points_list):
            place_points[points_list[idx]].append(team_idx)
    
    result = {}
    for points, team_indices in place_points.items():
        for team_idx in team_indices:
            result[team_idx] = points
    
    return result

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if method == 'GET':
            cursor.execute('''
                SELECT t.id, t.name,
                       COALESCE(SUM(r.points), 0) as total_points
                FROM teams t
                LEFT JOIN rounds r ON t.id = r.team_id
                GROUP BY t.id, t.name
                ORDER BY total_points DESC, t.name
            ''')
            teams = cursor.fetchall()
            
            cursor.execute('''
                SELECT r.*, t.name as team_name
                FROM rounds r
                JOIN teams t ON r.team_id = t.id
                ORDER BY r.round_number, r.points DESC
            ''')
            rounds = cursor.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'teams': [dict(team) for team in teams],
                    'rounds': [dict(round_data) for round_data in rounds]
                }, default=str)
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            round_number = body_data.get('round_number')
            team_results = body_data.get('team_results', [])
            
            round_coefficient = 1
            if round_number in [3, 4]:
                round_coefficient = 2
            elif round_number == 5:
                round_coefficient = 3
            
            times = [result['time_seconds'] for result in team_results]
            place_points = calculate_place_points(times)
            
            for idx, result in enumerate(team_results):
                team_id = result['team_id']
                is_correct = result['is_correct']
                time_seconds = result['time_seconds']
                has_blitz = result.get('has_blitz', False)
                
                place_score = place_points.get(idx, 0)
                
                points = 0
                if is_correct:
                    points = round_coefficient * place_score
                    if has_blitz:
                        points = points * 2
                
                cursor.execute('''
                    INSERT INTO rounds (round_number, team_id, is_correct, time_seconds, has_blitz, points)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (round_number, team_id) 
                    DO UPDATE SET 
                        is_correct = EXCLUDED.is_correct,
                        time_seconds = EXCLUDED.time_seconds,
                        has_blitz = EXCLUDED.has_blitz,
                        points = EXCLUDED.points
                ''', (round_number, team_id, is_correct, time_seconds, has_blitz, points))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'message': 'Результаты сохранены'})
            }
    
    finally:
        cursor.close()
        conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }
