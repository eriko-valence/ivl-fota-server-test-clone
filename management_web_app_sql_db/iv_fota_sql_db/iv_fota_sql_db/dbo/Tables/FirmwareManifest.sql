CREATE TABLE [dbo].[FirmwareManifest] (
    [Id]        INT         NOT NULL,
    [Version]   NCHAR (100) NULL,
    [Signature] NCHAR (500) NULL,
    [Uri]       NCHAR (200) NULL,
    [Md5]       NCHAR (500) NULL,
    PRIMARY KEY CLUSTERED ([Id] ASC)
);

