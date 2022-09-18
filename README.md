# Public library catalogues Node.JS Library

A Node JS library for searching UK public library catalogues. This was designed to be used in other projects that need to search multiple library catalogues.

## Description

In the UK there are about 200 public library services, each with their own Library Management System, and associated Online Public Access Catalogue (OPAC) - aside from some that share systems.

Despite so many, there are relatively few types of library systems, and fewer suppliers. This project aims to define the interactions with each type of web catalogue in order to automate common processes. Such as searching for a book.

This will provide data aggregation opportunities such as being able to query the whole UK for the availability of a particular book. Or it could provide functionality to manage a user's account across all their library accounts, such as automating book renewals.

## Library service Data

A list of UK public library authorities is included in the **data.json** file. This has the library authority name and the **type** of library service, along with specific data required to search that service e.g. the web URL. 

It includes the GSS code for each authority. This allows it to be combined with other datasets that may be published elsewhere.

For example:

| Name | Code | Type | URL |
| ---- | ---- | ---- | --- |
| Aberdeen City | S12000033 | spydus | https://aberdeencity.spydus.co.uk/ |

## Build

The project uses Node Package Manager (NPM) for package management. On downloading a copy of the project the required dependencies should be installed. Assuming [Node](https://nodejs.org/en/) is already installed, to build:

```bash
npm install
```

## Tests

Run these using Jest. For each library service, five ISBNs  are defined in `tests.json`. The tests require only one ISBN lookup to be successful (since books can drop out of circulation and we don't want automated tests to fail frequently for non-functional reasons).

## Usage

The project implements the following methods

| Method | Description |
| ------ | ----------- |
| Services | Returns stored data about library services (authorities). |
| Libraries | Returns branch/location information, taken from the online catalogue. |
| Availability | Returns availability of a particular book. |

### Services

Returns selected contents of the data.json file for each service. This can be useful if a developer wished to create an interface that listed the library authorities in a filter.

| Method | Description |
| ------ | ----------- |
| .services(serviceFilter) | Returns a list of library authorities. The service filter filters by name or code and is optional. |

### Libraries

Returns a list of the library service points in each library service. This may include mobile libraries, and different locations within individual buildings.

| Method | Description |
| ------ | ----------- |
| .libraries(serviceFilter) | Returns a list of libraries for each service. The service filter filters by name or code and is optional. |

### Availability

Returns data showing the number of available/unavailable copies of the relevant title in each library service point, for each library service.

| Method | Description |
| ------ | ----------- |
| .availability(isbn, serviceFilter) | Retrieves availability of a particular title by passing in ISBN. The service filter filters by name or code and is optional. |

## Licence

Original code licensed with [MIT Licence](Licence.txt).
