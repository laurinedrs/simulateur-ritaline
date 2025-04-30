import streamlit as st
import numpy as np
import matplotlib.pyplot as plt

st.set_page_config(page_title="Simulateur Ritaline LP", layout="centered")
st.title("🧠 Simulateur de concentration Ritaline LP")

st.markdown("""
Ce simulateur te permet d'estimer la concentration de Ritaline LP dans ton corps en fonction de tes prises (jusqu'à 3 par jour).
- Le modèle utilise une estimation : **50% libération immédiate**, **50% libération prolongée**.
- Les heures sont à entrer sous forme décimale (ex : 8.5 pour 8h30).
""")

# Entrées utilisateur
st.header("🕒 Saisie des prises")
col1, col2 = st.columns(2)
with col1:
    h1 = st.number_input("Heure prise 1", min_value=6.0, max_value=26.0, value=8.0, step=0.25)
    h2 = st.number_input("Heure prise 2", min_value=6.0, max_value=26.0, value=13.0, step=0.25)
    h3 = st.number_input("Heure prise 3", min_value=6.0, max_value=26.0, value=17.5, step=0.25)
with col2:
    d1 = st.number_input("Dose prise 1 (mg)", value=30)
    d2 = st.number_input("Dose prise 2 (mg)", value=20)
    d3 = st.number_input("Dose prise 3 (mg)", value=10)

# Fonction réaliste de libération immédiate + prolongée avec décroissance plus rapide

def simulate_lp(dose, t0, hours):
    t = hours - t0
    t[t < 0] = 0

    # Immédiate : pic rapide, chute vers 3h
    immediate = (dose * 0.5) * (t / 0.5) * np.exp(-t / 1.2)

    # Prolongée : pic vers 4h, effet sur 6–8h
    extended = (dose * 0.5) * ((t / 3)**2) * np.exp(-t / 3.5)

    return immediate + extended

# Heures de la journée de 6h à 2h (26.0 en décimal)
hours = np.arange(6.0, 26.25, 0.25)

# Concentration totale
total = simulate_lp(d1, h1, hours) + simulate_lp(d2, h2, hours) + simulate_lp(d3, h3, hours)

# Affichage graphique
st.header("📈 Courbe de concentration estimée")
fig, ax = plt.subplots()
ax.plot(hours, total, label="Concentration estimée (mg)", color="steelblue")
ax.set_xlabel("Heure de la journée")
ax.set_ylabel("mg dans le corps")
ax.set_title("Concentration de Ritaline LP dans le corps")
ax.grid(True)
ax.set_xlim(6, 26)
ax.set_xticks(np.arange(6, 27, 1))
ax.set_xticklabels([f"{int(h%24)}h" for h in np.arange(6, 27, 1)])
ax.set_ylim(0, max(total) + 5)
ax.legend()
st.pyplot(fig)

# Résumé
st.header("📊 Résumé")
st.write(f"**Concentration max estimée :** {np.max(total):.1f} mg vers {hours[np.argmax(total)]%24:.2f}h")
st.write(f"**Concentration à 20h :** {total[np.where(hours == 20.0)][0]:.1f} mg")
