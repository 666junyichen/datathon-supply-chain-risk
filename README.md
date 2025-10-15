## Datathon
Group: Powerhouse
# Supply Chain Risk Classification with Feature Engineering & SMOTE

This project focuses on analyzing a synthetic **supply chain logistics dataset** to classify risk levels (Low, Moderate, High).  
The raw dataset lacked meaningful structure and suffered from class imbalance, so advanced **feature engineering** and **SMOTE oversampling** were applied.  
The goal is to enhance predictive modeling, uncover business insights, and support **data-driven decision-making** in logistics.

---

## Key Steps
1. **Exploratory Data Analysis (EDA)**  
   - Visualized distributions, correlations, and GPS clustering to identify hidden structures.  
   - Verified dataset was synthetic (uniform spreads, capped values, weak correlations).  

2. **Feature Engineering**  
   Created new features to capture hidden dynamics:  
   - `fuel_efficiency_index` → links fuel use to driver behavior.  
   - `congestion_stress` → combines road and port congestion intensity.  
   - `logistics_resilience` → stability against delays and disruptions.  
   - `inventory_pressure` → demand vs inventory stress measure.  
   - `loading_saturation` → efficiency of loading/unloading.  
   - `clearance_friction` → customs × congestion delays.  
   - `human_performance_risk` → fatigue and behavior-driven risk.  

3. **Handling Class Imbalance**  
   - Used **SMOTE** (Synthetic Minority Oversampling) to balance classes.  
   - Ensured fair training for models by avoiding dominance of majority class.  

4. **Modeling & Evaluation**  
   - Trained classification models (XGB Boost and TAB Transformers) to predict **risk_classification**.  
   - Evaluated with **confusion matrices** and **feature importance plots**.  
   - Found engineered features spread importance across multiple factors, unlike raw data dominated by a single variable.  

---

## Insights
- Raw data was dominated by **disruption_likelihood_score**, leading to shortcut learning.  
- Engineered features like **logistics_resilience** and **clearance_friction** improved interpretability and predictive robustness.  
- SMOTE balanced the dataset, improving fairness in classification.  

---

## Business Value
- **Risk Detection:** Early identification of disruptions via resilience and human-performance features.  
- **Operational Efficiency:** Congestion and clearance insights allow smarter routing and scheduling.  
- **Inventory Management:** Pressure metric helps balance warehouses, preventing stockouts/overstock.  
- **Human Factor Control:** Monitoring fatigue and behavior can improve safety and reduce delays.  
- **Strategic Planning:** Enables “what-if” simulations for disruptions (e.g., port strikes, congestion spikes).  

## GUI
<img width="1197" height="638" alt="Screenshot 2025-10-02 at 11 41 00 AM" src="https://github.com/user-attachments/assets/c8a68ec7-8c97-4af6-822b-c6df3998a7d7" />





---
