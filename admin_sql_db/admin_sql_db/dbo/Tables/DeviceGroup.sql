CREATE TABLE [dbo].[DeviceGroup] (
    [Id]                INT         IDENTITY (1, 1) NOT NULL,
    [Name]              NCHAR (100) NULL,
    [DesiredFirmwareId] INT         NULL,
    PRIMARY KEY CLUSTERED ([Id] ASC),
    FOREIGN KEY ([DesiredFirmwareId]) REFERENCES [dbo].[DeviceFirmware] ([Id])
);



