import streamlit as st
import numpy as np
import matplotlib.pyplot as plt

st.set_page_config(page_title="Simulateur Ritaline LP", layout="centered")
st.title("🧠 Simulateur de concentration Ritaline LP")

st.markdown("""
Ce simulateur te permet d'estimer la concentration de Ritaline LP dans ton corps en fonction de tes prises (jusqu'à 3 par jour).
- Le modèle utilise une estimation : **50% libération immédiate**, **50% prolongée**.
- Les heures sont à entrer sous forme décimale (ex : 8.5 pour 8h30).
""")

# Entrées utilisateur
st.header("🕒 Saisie des prises")
col1, col2 = st.columns(2)
with col1:
    h1 = st.number_input("Heure prise 1", min_value=0.0, max_value=24.0, value=8.0, step=0.25)
    h2 = st.number_input("Heure prise 2", min_value=0.0, max_value=24.0, value=13.0, step=0.25)
    h3 = st.number_input("Heure prise 3", min_value=0.0, max_value=24.0, value=17.5, step=0.25)
with col2:
    d1 = st.number_input("Dose prise 1 (mg)", value=30)
    d2 = st.number_input("Dose prise 2 (mg)", value=20)
    d3 = st.number_input("Dose prise 3 (mg)", value=10)

# Fonction de simulation réaliste
def simulate_lp(dose, t0, hours):
    t = hours - t0
    t[t < 0] = 0
    # Phase immédiate (50%) : rapide, douce décroissance
    immediate = (dose * 0.5) * (t / 1) * np.exp(-t / 1.5)
    # Phase prolongée (50%) : diffusion continue
    extended = (dose * 0.5) * ((t / 6)**2) * np.exp(-t / 6)
    return immediate + extended

# Calculs
hours = np.arange(0, 24.25, 0.25)
total = simulate_lp(d1, h1, hours) + simulate_lp(d2, h2, hours) + simulate_lp(d3, h3, hours)

# Affichage de la courbe
st.header("📈 Courbe de concentration estimée")
fig, ax = plt.subplots()
ax.plot(hours, total, label="Concentration estimée (mg)", color="steelblue")
ax.set_xlabel("Heure de la journée")
ax.set_ylabel("mg dans le corps")
ax.set_title("Concentration de Ritaline LP dans le corps")
ax.grid(True)
ax.set_xlim(0, 24)
ax.set_ylim(0, max(total) + 5)
ax.legend()
st.pyplot(fig)

# Résumé
st.header("📊 Résumé")
st.write(f"**Concentration max estimée :** {np.max(total):.1f} mg vers {hours[np.argmax(total)]:.2f}h")
st.write(f"**Concentration à 20h :** {total[np.where(hours == 20.0)][0]:.1f} mg")
