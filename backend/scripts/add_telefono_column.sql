-- Script para añadir la columna 'telefono' a la tabla 'usuarios'

ALTER TABLE usuarios
ADD COLUMN telefono VARCHAR(20) NULL AFTER email;

-- Nota: Este script debe ejecutarse en la base de datos del proyecto
-- Comando para ejecutar desde la línea de comandos:
-- mysql -u [usuario] -p [nombre_base_datos] < add_telefono_column.sql