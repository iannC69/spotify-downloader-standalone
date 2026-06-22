# Ghid de Migrare: De la Domeniul Actual la `iannc.ro`

Acest document conține toți pașii pe care trebuie să îi urmezi atunci când te decizi să cumperi oficial domeniul `iannc.ro` și vrei să treci tot site-ul și sistemele pe el. Păstrează-l la îndemână!

## Pasul 1: Cumpărarea și Conectarea Domeniului
1. Cumpără domeniul `iannc.ro` (de exemplu de la Hostico, RoTLD, etc.).
2. Intră în setările domeniului (la firma de unde l-ai cumpărat) și schimbă **NameServerele (NS)** cu cele de la Freakhosting, pentru a lega domeniul de găzduirea ta.
3. Intră în panoul tău de control cPanel de la Freakhosting.
4. Du-te la secțiunea **Addon Domains** (sau **Domains**) și adaugă noul tău domeniu: `iannc.ro`. Acest pas va crea un folder nou pe server pentru site-ul tău.

## Pasul 2: Configurarea Adresei de E-mail
Odată ce `iannc.ro` este adăugat în cPanel:
1. În cPanel, mergi la **Email Accounts**.
2. Dă click pe **Create**.
3. Selectează din listă domeniul `iannc.ro`.
4. La Username scrie: `contact`.
5. Setează o parolă puternică și apasă pe Create.
6. Felicitări! Ai creat oficial căsuța poștală `contact@iannc.ro`. O poți accesa din cPanel -> Check Email (Webmail).

## Pasul 3: Actualizarea Sistemului de Contact (Web3Forms API)
Acum că ai adresa oficială, trebuie să "mutăm" API-ul ca să primești cererile direct pe acel mail.
1. Intră pe [Web3Forms](https://web3forms.com/).
2. Apasă pe **Create Access Key**.
3. De data aceasta, folosește adresa nouă creată: `contact@iannc.ro`.
4. Vei primi un mail de confirmare și un nou **Access Key** în căsuța de mail (intră pe Webmail-ul de pe Freakhosting ca să îl citești).
5. Copiază noul `Access Key`.
6. Deschide fișierul codului tău: `src/pages/Home.jsx`.
7. Caută linia unde definim codul curent (în funcția `handleFormSubmit`):
   ```javascript
   object.access_key = "c57558e4-33b0-4400-8560-748494e0d84f"; // Înlocuiește asta!
   ```
8. Șterge codul vechi și lipește-l pe cel nou. Salvează fișierul.

## Pasul 4: Mutarea Fișierelor Site-ului și Găzduirea (Hosting)
1. Înainte de a genera versiunea finală a site-ului, asigură-te că fișierul `.env` este completat cu datele tale curente (Spotify, Twitch, etc.). Când rulezi build-ul, vite va "coace" aceste variabile în codul final.
2. Generează fișierele finale de producție (din terminal rulezi `npm run build`).
3. Va fi generat un folder `dist`.
4. Ia toate fișierele din folderul `dist` și mută-le (sau uploadează-le) în folderul principal al domeniului de pe server (`/public_html/iannc.ro` din cPanel-ul Freakhosting).

## Pasul 5: Actualizarea API-urilor pentru noul domeniu (`iannc.ro`)
Momentan, pe localhost, API-urile tale (Spotify și Twitch) cel mai probabil nu fac figuri, dar când vei muta site-ul pe internet, setările de securitate (CORS) sau URL-urile de redirecționare trebuie să știe despre noul tău domeniu.

### 1. Spotify API (Spotify Developer Dashboard)
Dacă folosești widget-ul de Spotify (Now Playing / Profile):
1. Intră în [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/).
2. Selectează aplicația ta.
3. Du-te la **Settings**.
4. La rubrica **Redirect URIs**, trebuie neapărat să ștergi sau să adaugi lângă `http://localhost:5173/callback` noua ta adresă oficială: `https://iannc.ro` (sau `https://iannc.ro/callback` în funcție de cum ai configurat scriptul de generare a Refresh Token-ului).
5. Salvează setările.
*Notă: Dacă token-ul tău de Refresh `SPOTIFY_REFRESH_TOKEN` expiră vreodată sau e revocat, va trebui să îl re-generezi folosind noul domeniu ca URL de întoarcere.*

### 2. Twitch API (Twitch Developer Console)
Dacă ai vreo integrare care preia statusul de live/stream de pe Twitch:
1. Intră în [Twitch Developer Console](https://dev.twitch.tv/console).
2. La secțiunea **Applications**, alege aplicația ta.
3. La rubrica **OAuth Redirect URLs**, asigură-te că adaugi `https://iannc.ro`.

### 3. Alte Tool-uri / API-uri
Orice alt serviciu pe care îl folosești pe site (Google Analytics, baze de date de la Firebase, servicii de autentificare precum Discord OAuth, etc.):
- Toate vor avea o secțiune de "Authorized Domains" sau "CORS Origins".
- Oriunde vezi scris `localhost:5173` în setările lor, adaugă un rând nou cu `https://iannc.ro`.

---
Gata! Din acest moment ai un domeniu profesional (`iannc.ro`), o adresă de e-mail integrată perfect, iar toate API-urile sunt legate și securizate pentru a funcționa direct pe domeniul tău oficial, nu pe calculatorul de acasă.
