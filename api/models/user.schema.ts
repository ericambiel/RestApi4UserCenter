import { Schema } from "mongoose";

const UserSchema = new Schema({
    nome: { type: String, require: true },
    sobreNome: { type: String, require: true },
    email: { type: String, require: true },
    password: { type: Number, require: true },
    permissionLevel: { type: Number, require: true}
})