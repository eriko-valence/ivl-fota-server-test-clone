CREATE TABLE [dbo].[DeviceFirmware] (
    [Id]            INT         IDENTITY (1, 1) NOT NULL,
    [Version]       NCHAR (100) NULL,
    [Signature]     NCHAR (500) NULL,
    [Md5]           NCHAR (500) NULL,
    [BlobName]      NCHAR (500) NULL,
    [BlobContainer] NCHAR (500) NULL,
    PRIMARY KEY CLUSTERED ([Id] ASC)
);

