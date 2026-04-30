# Street_Lamp_Project

This project was thought out to function as a communication between 2 boards and a UI that will behave similarly to a adjustable lamp.
The main components in this are an Esp8266, a Lolin32 and a UI that was made in React.

# Project flow

The project can be broken into 3 parts: the sensor/actuator node, the gateway communication node and the frontend.

The sensor node, the Esp8266, reads a photoresistor value that it sends to the gateway node, the Lolin32 via ESP-NOW broadcasting.
The Lolin32 receives a threshold inputed by the user in the interface and it compares this value to the value sent by the Esp8266
If the value is lower, meaning it is darker outside that the threshold, the Lolin32 will send the command to the Esp8266 to turn on the LED, also
through ESP-NOW broadcasting.

# The circuit layout

<img width="2000" height="1058" alt="WhatsApp Image 2026-04-30 at 13 10 54" src="https://github.com/user-attachments/assets/e3b0458f-8029-492f-b694-66344052879a" />

# The User Interface
<img width="1890" height="982" alt="image" src="https://github.com/user-attachments/assets/f80a4f76-3485-4176-9afc-e52ea9d1f713" />

The UI contains:
- the name of the project
- the connections status with the Lolin
- the Moving Average value of the last 5 readings
- the actual reading of the sensor
- the current threshold
- a button to change the threshold
The range from 0-100 was mapped from the values given by the photoresistor in the range of 1023-0.
