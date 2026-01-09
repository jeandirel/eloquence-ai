"""
Script de démonstration Gesture Lab - Structure exacte du code utilisateur
Utilise MediaPipe Hands au lieu de Pose
"""
import cv2
import mediapipe as mp
import numpy as np

mp_drawing = mp.solutions.drawing_utils
mp_hands = mp.solutions.hands

cap = cv2.VideoCapture(0)

## Setup mediapipe instance
with mp_hands.Hands(min_detection_confidence=0.5, min_tracking_confidence=0.5) as hands:
    while cap.isOpened():
        ret, frame = cap.read()
        
        # Recolor image to RGB
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image.flags.writeable = False
      
        # Make detection
        results = hands.process(image)
    
        # Recolor back to BGR
        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        
        # Extract landmarks
        try:
            landmarks = results.multi_hand_landmarks[0].landmark
            
            # Classification simple (même logique que votre code Pose)
            fingers = []
            tips = [8, 12, 16, 20]
            pips = [6, 10, 14, 18]
            
            for tip, pip in zip(tips, pips):
                if landmarks[tip].y < landmarks[pip].y:
                    fingers.append(1)
                else:
                    fingers.append(0)
            
            # Déterminer le geste
            gesture = "UNKNOWN"
            if sum(fingers) == 0:
                gesture = "FIST"
            elif sum(fingers) == 4:
                gesture = "OPEN_PALM"
            elif fingers[0] == 1 and sum(fingers) == 1:
                gesture = "POINTING"
            elif fingers[0] == 1 and fingers[1] == 1 and sum(fingers) == 2:
                gesture = "TWO_FINGERS"
            
            # Afficher le geste sur l'image
            cv2.putText(image, f"Geste: {gesture}", (10, 50), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
        except:
            pass
        
        # Render detections (VOS couleurs exactes)
        mp_drawing.draw_landmarks(
            image, 
            results.multi_hand_landmarks[0] if results.multi_hand_landmarks else None,
            mp_hands.HAND_CONNECTIONS,
            mp_drawing.DrawingSpec(color=(245, 117, 66), thickness=2, circle_radius=2), 
            mp_drawing.DrawingSpec(color=(245, 66, 230), thickness=2, circle_radius=2) 
        )               
        
        cv2.imshow('Mediapipe Gesture Feed', image)

        if cv2.waitKey(10) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()
