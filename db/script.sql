USE [master]
GO
/****** Object:  Database [FactuEduDB]    Script Date: 5/22/2025 4:08:02 AM ******/
CREATE DATABASE [FactuEduDB]
GO
ALTER DATABASE [FactuEduDB] SET COMPATIBILITY_LEVEL = 160
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [FactuEduDB].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [FactuEduDB] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [FactuEduDB] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [FactuEduDB] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [FactuEduDB] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [FactuEduDB] SET ARITHABORT OFF 
GO
ALTER DATABASE [FactuEduDB] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [FactuEduDB] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [FactuEduDB] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [FactuEduDB] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [FactuEduDB] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [FactuEduDB] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [FactuEduDB] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [FactuEduDB] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [FactuEduDB] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [FactuEduDB] SET  ENABLE_BROKER 
GO
ALTER DATABASE [FactuEduDB] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [FactuEduDB] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [FactuEduDB] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [FactuEduDB] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [FactuEduDB] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [FactuEduDB] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [FactuEduDB] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [FactuEduDB] SET RECOVERY FULL 
GO
ALTER DATABASE [FactuEduDB] SET  MULTI_USER 
GO
ALTER DATABASE [FactuEduDB] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [FactuEduDB] SET DB_CHAINING OFF 
GO
ALTER DATABASE [FactuEduDB] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [FactuEduDB] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [FactuEduDB] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [FactuEduDB] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
EXEC sys.sp_db_vardecimal_storage_format N'FactuEduDB', N'ON'
GO
ALTER DATABASE [FactuEduDB] SET QUERY_STORE = ON
GO
ALTER DATABASE [FactuEduDB] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 1000, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO, MAX_PLANS_PER_QUERY = 200, WAIT_STATS_CAPTURE_MODE = ON)
GO
USE [FactuEduDB]
GO
/****** Object:  Table [dbo].[credito_fiscal]    Script Date: 5/22/2025 4:08:02 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[credito_fiscal](
	[id_credito] [int] IDENTITY(1,1) NOT NULL,
	[id_tarea] [int] NULL,
	[cliente_nombre] [nvarchar](100) NULL,
	[fecha] [date] NULL,
	[direccion] [nvarchar](200) NULL,
	[municipio] [nvarchar](100) NULL,
	[departamento] [nvarchar](100) NULL,
	[nit] [nvarchar](20) NULL,
	[registro] [nvarchar](20) NULL,
	[giro] [nvarchar](150) NULL,
	[nota_remision] [nvarchar](50) NULL,
	[fecha_nota] [date] NULL,
	[condicion] [nvarchar](50) NULL,
	[venta_cta_de] [nvarchar](150) NULL,
	[total_literal] [nvarchar](300) NULL,
	[suma] [decimal](10, 2) NULL,
	[iva13] [decimal](10, 2) NULL,
	[sub_total] [decimal](10, 2) NULL,
	[iva_retenido] [decimal](10, 2) NULL,
	[ventas_exentas] [decimal](10, 2) NULL,
	[ventas_no_sujetas] [decimal](10, 2) NULL,
	[venta_total] [decimal](10, 2) NULL,
	[entregado_nombre] [nvarchar](100) NULL,
	[entregado_dui] [nvarchar](20) NULL,
	[entregado_firma] [nvarchar](100) NULL,
	[recibido_nombre] [nvarchar](100) NULL,
	[recibido_dui] [nvarchar](20) NULL,
	[recibido_firma] [nvarchar](100) NULL,
	[id_alumno] [int] NOT NULL,
	[nota] [decimal](3, 1) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_credito] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[credito_fiscal_detalle]    Script Date: 5/22/2025 4:08:02 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[credito_fiscal_detalle](
	[id_detalle] [int] IDENTITY(1,1) NOT NULL,
	[id_credito] [int] NULL,
	[cantidad] [int] NULL,
	[descripcion] [nvarchar](200) NULL,
	[precio_unitario] [decimal](10, 2) NULL,
	[no_sujetas] [decimal](10, 2) NULL,
	[exentas] [decimal](10, 2) NULL,
	[gravadas] [decimal](10, 2) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_detalle] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DetalleFacturaConsumidorFinal]    Script Date: 5/22/2025 4:08:02 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DetalleFacturaConsumidorFinal](
	[IdDetalle] [int] IDENTITY(1,1) NOT NULL,
	[IdFactura] [int] NOT NULL,
	[Cantidad] [int] NOT NULL,
	[Descripcion] [nvarchar](200) NOT NULL,
	[PrecioUnitario] [decimal](10, 2) NOT NULL,
	[VentaNoSujeta] [decimal](10, 2) NULL,
	[VentaExenta] [decimal](10, 2) NULL,
	[VentaGravada] [decimal](10, 2) NULL,
PRIMARY KEY CLUSTERED 
(
	[IdDetalle] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FacturaConsumidorFinal]    Script Date: 5/22/2025 4:08:02 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FacturaConsumidorFinal](
	[IdFactura] [int] IDENTITY(1,1) NOT NULL,
	[Dia] [tinyint] NOT NULL,
	[Mes] [tinyint] NOT NULL,
	[Anio] [smallint] NOT NULL,
	[NombreCliente] [nvarchar](100) NOT NULL,
	[DUI_o_NIT] [nvarchar](20) NOT NULL,
	[Direccion] [nvarchar](200) NOT NULL,
	[VentaCuentaDe] [nvarchar](100) NULL,
	[SonTexto] [nvarchar](300) NULL,
	[Sumas] [decimal](10, 2) NULL,
	[VentaExenta] [decimal](10, 2) NULL,
	[VentaNoSujeta] [decimal](10, 2) NULL,
	[IvaRetenido] [decimal](10, 2) NULL,
	[VentaTotal] [decimal](10, 2) NULL,
	[Entregado_Nombre] [nvarchar](100) NULL,
	[Entregado_DUI] [nvarchar](20) NULL,
	[Entregado_Firma] [nvarchar](100) NULL,
	[Recibido_Nombre] [nvarchar](100) NULL,
	[Recibido_DUI] [nvarchar](20) NULL,
	[Recibido_Firma] [nvarchar](100) NULL,
	[id_tarea] [int] NULL,
	[id_alumno] [int] NOT NULL,
	[nota] [decimal](3, 1) NULL,
PRIMARY KEY CLUSTERED 
(
	[IdFactura] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[integrantesSecciones]    Script Date: 5/22/2025 4:08:02 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[integrantesSecciones](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[id_alumno] [int] NOT NULL,
	[carnet_alumno] [varchar](20) NULL,
	[id_seccion] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[nota_credito]    Script Date: 5/22/2025 4:08:02 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[nota_credito](
	[id_nota] [int] IDENTITY(1,1) NOT NULL,
	[id_tarea] [int] NULL,
	[cliente_nombre] [nvarchar](100) NULL,
	[fecha_emision] [date] NULL,
	[direccion] [nvarchar](200) NULL,
	[doc_modifica_tipo] [nvarchar](50) NULL,
	[doc_modifica_serie_numero] [nvarchar](50) NULL,
	[fecha_original] [date] NULL,
	[motivo_modificacion] [nvarchar](300) NULL,
	[subtotal] [decimal](10, 2) NULL,
	[igv] [decimal](10, 2) NULL,
	[total] [decimal](10, 2) NULL,
	[id_alumno] [int] NOT NULL,
	[nota] [decimal](3, 1) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_nota] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[nota_credito_detalle]    Script Date: 5/22/2025 4:08:02 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[nota_credito_detalle](
	[id_detalle] [int] IDENTITY(1,1) NOT NULL,
	[id_nota] [int] NULL,
	[item] [int] NULL,
	[codigo] [nvarchar](50) NULL,
	[cantidad] [int] NULL,
	[descripcion] [nvarchar](200) NULL,
	[precio_unitario] [decimal](10, 2) NULL,
	[descuento] [decimal](10, 2) NULL,
	[valor_venta] [decimal](10, 2) NULL,
PRIMARY KEY CLUSTERED 
(
	[id_detalle] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[secciones]    Script Date: 5/22/2025 4:08:02 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[secciones](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [varchar](50) NOT NULL,
	[anio] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tareas]    Script Date: 5/22/2025 4:08:02 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tareas](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[id_maestro] [int] NOT NULL,
	[tipo_tarea] [tinyint] NOT NULL,
	[id_seccion] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[usuarios]    Script Date: 5/22/2025 4:08:02 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[usuarios](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[codigo] [varchar](20) NOT NULL,
	[password] [nvarchar](255) NOT NULL,
	[rol] [tinyint] NOT NULL,
	[nombre] [nvarchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[codigo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[credito_fiscal]  WITH CHECK ADD FOREIGN KEY([id_tarea])
REFERENCES [dbo].[tareas] ([id])
GO
ALTER TABLE [dbo].[credito_fiscal]  WITH CHECK ADD  CONSTRAINT [FK_credito_fiscal_usuario] FOREIGN KEY([id_alumno])
REFERENCES [dbo].[usuarios] ([id])
GO
ALTER TABLE [dbo].[credito_fiscal] CHECK CONSTRAINT [FK_credito_fiscal_usuario]
GO
ALTER TABLE [dbo].[credito_fiscal_detalle]  WITH CHECK ADD FOREIGN KEY([id_credito])
REFERENCES [dbo].[credito_fiscal] ([id_credito])
GO
ALTER TABLE [dbo].[DetalleFacturaConsumidorFinal]  WITH CHECK ADD  CONSTRAINT [FK_DetalleFCF_FacturaConsumidorFinal] FOREIGN KEY([IdFactura])
REFERENCES [dbo].[FacturaConsumidorFinal] ([IdFactura])
GO
ALTER TABLE [dbo].[DetalleFacturaConsumidorFinal] CHECK CONSTRAINT [FK_DetalleFCF_FacturaConsumidorFinal]
GO
ALTER TABLE [dbo].[FacturaConsumidorFinal]  WITH CHECK ADD FOREIGN KEY([id_tarea])
REFERENCES [dbo].[tareas] ([id])
GO
ALTER TABLE [dbo].[FacturaConsumidorFinal]  WITH CHECK ADD  CONSTRAINT [FK_FacturaConsumidorFinal_usuario] FOREIGN KEY([id_alumno])
REFERENCES [dbo].[usuarios] ([id])
GO
ALTER TABLE [dbo].[FacturaConsumidorFinal] CHECK CONSTRAINT [FK_FacturaConsumidorFinal_usuario]
GO
ALTER TABLE [dbo].[integrantesSecciones]  WITH CHECK ADD FOREIGN KEY([id_alumno])
REFERENCES [dbo].[usuarios] ([id])
GO
ALTER TABLE [dbo].[integrantesSecciones]  WITH CHECK ADD FOREIGN KEY([id_seccion])
REFERENCES [dbo].[secciones] ([id])
GO
ALTER TABLE [dbo].[nota_credito]  WITH CHECK ADD FOREIGN KEY([id_tarea])
REFERENCES [dbo].[tareas] ([id])
GO
ALTER TABLE [dbo].[nota_credito]  WITH CHECK ADD  CONSTRAINT [FK_nota_credito_usuario] FOREIGN KEY([id_alumno])
REFERENCES [dbo].[usuarios] ([id])
GO
ALTER TABLE [dbo].[nota_credito] CHECK CONSTRAINT [FK_nota_credito_usuario]
GO
ALTER TABLE [dbo].[nota_credito_detalle]  WITH CHECK ADD FOREIGN KEY([id_nota])
REFERENCES [dbo].[nota_credito] ([id_nota])
GO
ALTER TABLE [dbo].[tareas]  WITH CHECK ADD  CONSTRAINT [fk_tareas_maestro] FOREIGN KEY([id_maestro])
REFERENCES [dbo].[usuarios] ([id])
GO
ALTER TABLE [dbo].[tareas] CHECK CONSTRAINT [fk_tareas_maestro]
GO
ALTER TABLE [dbo].[tareas]  WITH CHECK ADD  CONSTRAINT [fk_tareas_seccion] FOREIGN KEY([id_seccion])
REFERENCES [dbo].[secciones] ([id])
GO
ALTER TABLE [dbo].[tareas] CHECK CONSTRAINT [fk_tareas_seccion]
GO
ALTER TABLE [dbo].[tareas]  WITH CHECK ADD  CONSTRAINT [chk_tareas_tipo] CHECK  (([tipo_tarea]=(3) OR [tipo_tarea]=(2) OR [tipo_tarea]=(1)))
GO
ALTER TABLE [dbo].[tareas] CHECK CONSTRAINT [chk_tareas_tipo]
GO
ALTER TABLE [dbo].[usuarios]  WITH CHECK ADD  CONSTRAINT [chk_usuarios_rol] CHECK  (([rol]=(2) OR [rol]=(1)))
GO
ALTER TABLE [dbo].[usuarios] CHECK CONSTRAINT [chk_usuarios_rol]
GO
USE [master]
GO
ALTER DATABASE [FactuEduDB] SET  READ_WRITE 
GO
