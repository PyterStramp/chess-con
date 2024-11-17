# Chess con

## Descripción

Es una plataforma de ajedrez en línea que permite a los usuarios jugar partidas de ajedrez en tiempo real, además de registrar juegos y puntuaciones, además, el proyecto se basa en un enfoque modular y escalable, aprovechando tecnologías PostgreSQL, Redis, y Socket.IO.

> **Nota**: Este proyecto está inspirado en [online-chess-udemy](https://github.com/codingexpert1999/online-chess-udemy). Las principales diferencias incluyen:
> - **PostgreSQL** en lugar de MySQL para la base de datos relacional.
> - Una **versión actualizada de Redis** (v4.7.0) en lugar de la 3.1.2.

---

## Tecnologías Usadas

- **Node.js**: Para manejar el backend del servidor.
- **PostgreSQL**: Como base de datos relacional para almacenar usuarios, juegos y puntuaciones.
- **Redis**: Para caché de datos y manejo de sesiones en tiempo real.
- **Socket.IO**: Para la comunicación en tiempo real entre los jugadores.

---

## Instalación

### Requisitos Previos

1. **Node.js**:
   - Es necesario tener instalado NodeJs.
   - Puedes descargarlo desde [Node.js](https://nodejs.org/).

2. **PostgreSQL**:
   - Instala PostgreSQL desde [PostgreSQL Downloads](https://www.postgresql.org/download/).
   - Configura la base de datos según el archivo de extensión sql, que contiene tanto las tablas como los procedimientos almacenados.

3. **Redis**:
   - En Windows, puedes usar este port de [Redis Windows](https://github.com/microsoftarchive/redis).
   - También puedes usar **Memurai**, un cliente compatible con Redis [Memurai](https://www.memurai.com/).
   - Si estás en MacOs, y si tienes **Homebrew** instalado, puedes instalar Redis con:
     ```
     brew install redis
     ```
     Una vez instalado, inicia Redis con:
     ```
     brew services start redis
     ```
     
   - Alternativamente, puedes usar WSL (Windows Subsystem for Linux) para instalar Redis, o usar docker:
     ```
     sudo apt update
     sudo apt install redis
     redis-server
     ```

4. **Git**:
   - Clona el repositorio con:
     ```bash
     git clone https://github.com/PyterStramp/chess-con.git
     ```

### Pasos de Instalación

1. **Clonar el Repositorio**:
   ```
   git clone https://github.com/PyterStramp/chess-con.git
   cd chess-con
   ```
2. **Instalar las dependencias**
   ```
   npm install
   ```
3. **Archivo .env**
   Crea el archivo de variables de entorno, y configúralo así:
   ```
    PORT = 5000

    POSTGRES_USER=tu_usuario
    POSTGRES_HOST=tu_host
    POSTGRES_DATABASE=chess_con
    POSTGRES_PASS=tu_contraseña
    POSTGRES_PORT=5432
    JWT_SECRET=tu_secreto
   ```
4. **Inicia el proyecto**
