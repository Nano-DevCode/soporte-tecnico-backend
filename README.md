<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Descripción

Sistema integral de gestión de soporte técnico, mesa de ayuda, activos de cómputo y seguimiento de tickets. 

## Descargar dependencias y levantar el entorno de desarrollo
Ojo se que es obivo pero checa tener docker por que sin eso no se levanta nada
```bash
# Checa que tengas el archivo .env con las variables de desarrollo
$ docker compose up -d
$ pnpm install
```

## Compilar y correr el proyecto

```bash
# development
$ pnpm start

# watch mode
$ pnpm start:dev

# production mode
$ pnpm start:prod
```

# Importante
## 1.- Migración inicial
Antes de poder llevar a produccion es necesario ejecutar el comando siguiente,
debido a que en producción se desactiva el modo synchronize de TypeORM,
este comando toma de los archivos de las entidades y lo genera en una migración
```bash
$ pnpm migration:generate
```
## 2.- Modifica el .env para producción
Cambia los siguiente, por que cada cosa se ejecuta en un contenedor distinto en produccion
- DB_SYNCHRONIZE=true a DB_SYNCHRONIZE=false
- DB_HOST_POSTGRES=localhost a DB_HOST_POSTGRES=db
- DB_HOST_REDIS=localhost a DB_HOST_REDIS=redis
- MINIO_ENDPOINT=http://localhost:9000 a MINIO_ENDPOINT=http://minio:9000

## 3.- Tener el certificado SSL
Tendras que haber cambiado la ip a la del servidor en el archivo de nginix, si no, no funcionara despues de eso ejecutaras el
siguiente comando para para tener el sertificado, recuerda que solo dura un año asi que ppra renovarlo toca ejecutar el mismo comando

```bash
docker run --rm -v ${PWD}/nginx/certs:/certs alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/server.key -out /certs/server.crt -subj "/CN=10.168.101.10"
```

## 4.- Levantar el docker
 
Para levantar el proyecto por primera vez o después de cambios en el código:
 
```bash
docker compose up -d --build
```
 
> Si tienes problemas con el caché de Docker, agrega `--no-cache`:
> ```bash
> docker compose up -d --build --no-cache
> ```
 
### Primer despliegue en servidor existente
 
Si la base de datos ya tiene tablas creadas previamente (por ejemplo, con `synchronize: true`), el migrator fallará porque intentará crear tablas que ya existen. En ese caso registra manualmente la migración del schema inicial:
 
```bash
docker exec -it soportetecnicodb psql -U postgres -d SoporteTecnicoDB -c \
  "INSERT INTO migrations (timestamp, name) VALUES (1782530031279, 'InitialSchema1782530031279');"
```
 
Luego reinicia el migrator:
 
```bash
docker compose restart migrator
```
 
### Instalación limpia (servidor nuevo o DB vacía)
 
No necesitas hacer nada adicional. El migrator corre automáticamente y crea todas las tablas e inserta el superusuario inicial.
 
### Orden de arranque
 
```
db → migrator (crea tablas + seed) → backend
```
 
El backend no arranca hasta que el migrator termine exitosamente.



## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
