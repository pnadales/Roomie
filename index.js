const fs = require('fs');
const axios = require('axios');
const express = require('express');
const app = express();
const { v4: uuidv4 } = require('uuid')
const bodyParser = require('body-parser');

app.listen(3000, () => console.log("Servidor en el puerto http://localhost:3000/"))
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html")
});

function actualizarMontos(rNombre, monto) {
    const roommatesJSON = JSON.parse(fs.readFileSync("roommates_data.json", "utf-8"))
    const roommates = roommatesJSON.roommates;
    const cantidad = roommates.length
    const acreedor = roommates.find((mate) => mate.nombre == rNombre)
    acreedor.recibe = acreedor.recibe + ((monto / cantidad) * (cantidad - 1))
    acreedor.total = acreedor.recibe - acreedor.debe

    roommatesJSON.roommates = roommates.map((roommate) => {
        if (roommate.nombre == rNombre) {
            return acreedor
        }
        roommate.debe = roommate.debe + (monto / cantidad)
        roommate.total = roommate.recibe - roommate.debe
        return roommate
    })

    fs.writeFileSync("roommates_data.json", JSON.stringify(roommatesJSON));

}

app.get("/roommates", (req, res) => {
    const roommatesJSON = JSON.parse(fs.readFileSync("roommates_data.json", "utf-8"));
    res.json(roommatesJSON)
});

app.get("/gastos", (req, res) => {
    const gastosJSON = JSON.parse(fs.readFileSync("gastos_data.json", "utf-8"));
    res.json(gastosJSON)
});

app.post('/roommate', async (req, res) => {
    // id, nombre, email, debe, recibe total
    //agregar try
    try {
        const response = await axios.get('https://randomuser.me/api');
        //Arrego de objetos con los datos de la api
        const randomUser = response.data.results[0];


        const roommate = { id: uuidv4().slice(30), nombre: `${randomUser.name.first} ${randomUser.name.last}`, email: randomUser.email, debe: 0, recibe: 0, total: 0 };

        const roommateJSON = JSON.parse(fs.readFileSync("roommates_data.json", "utf-8"))
        const roommates = roommateJSON.roommates;

        roommates.push(roommate)

        fs.writeFileSync("roommates_data.json", JSON.stringify(roommateJSON));
        res.status(200).json(roommate)
    }
    catch (e) {
        console.log(e)
    }
})
app.post('/gasto', async (req, res) => {
    //raoommate, descripcion, monto, fecha, id
    try {
        const { roommate, descripcion, monto } = req.body

        const gasto = { roommate, descripcion, monto, id: uuidv4().slice(30) };
        const gastoJSON = JSON.parse(fs.readFileSync("gastos_data.json", "utf-8"))
        const gastos = gastoJSON.gastos;

        gastos.push(gasto)

        fs.writeFileSync("gastos_data.json", JSON.stringify(gastoJSON));
        actualizarMontos(roommate, monto)
        res.status(200).json(gasto)
    }
    catch (e) {
        console.log(e)
    }
})

app.delete('/gasto', (req, res) => {
    const { id } = req.query
    const gastosJSON = JSON.parse(fs.readFileSync("gastos_data.json", "utf-8"))

    const gastos = gastosJSON.gastos;
    gastosJSON.gastos = gastos.filter((gasto) => gasto.id !== id);
    fs.writeFileSync("gastos_data.json", JSON.stringify(gastosJSON));
    res.status(200).json(req.query)

})

app.put("/gasto", (req, res) => {
    const { id } = req.query
    const { roommate, descripcion, monto } = req.body;
    const nuevoGasto = { roommate, descripcion, monto, id };
    const gastosJSON = JSON.parse(fs.readFileSync("gastos_data.json", "utf-8"))
    const gastos = gastosJSON.gastos;
    const gastoViejo = gastos.find((gasto) => gasto.id == id)
    actualizarMontos(gastoViejo.roommate, -gastoViejo.monto)

    gastosJSON.gastos = gastos.map((gasto) => gasto.id === id ? nuevoGasto : gasto)

    fs.writeFileSync("gastos_data.json", JSON.stringify(gastosJSON));
    actualizarMontos(roommate, monto)
    res.send("gasto modificada con éxito");

})


app.get('*', (req, res) => {
    res.send('Página no encontrada')
})